
var term = {
    BLACK       : 30,        GRAY        :90,
    RED         : 31,        LIGHTRED    :91,
    GREEN       : 32,        LIGHTGREEN  :92,
    YELLOW      : 33,        LIGHTYELLOW :93,
    BLUE        : 34,        LIGHTBLUE   :94,
    MAGENTA     : 35,        LIGHTMAGENTA:95,
    CYAN        : 36,        LIGHTCYAN   :96,
    LIGHTGRAY   : 37,        WHITE       :97,
    BOLD: 'bold',
    UNDERLINE: 'underline',
    ITALIC: 'italic'
};

var colors = [term.BLACK, term.GRAY, term.RED, term.LIGHTRED, term.GREEN, 
    term.LIGHTGREEN, term.YELLOW, term.LIGHTYELLOW, term.BLUE, term.LIGHTBLUE, 
    term.MAGENTA, term.LIGHTMAGENTA, term.CYAN, term.LIGHTCYAN, term.LIGHTGRAY, term.WHITE];

var ansiToCSS = {};
(function() {
    var a = ansiToCSS;
    a[term.BLACK]       = 'ansi-black';    a[term.GRAY]        = 'ansi-gray';
    a[term.RED]         = 'ansi-red';      a[term.LIGHTRED]    = 'ansi-lightred';
    a[term.GREEN]       = 'ansi-green';    a[term.LIGHTGREEN]  = 'ansi-lightgreen';
    a[term.YELLOW]      = 'ansi-yellow';   a[term.LIGHTYELLOW] = 'ansi-lightyellow';
    a[term.BLUE]        = 'ansi-blue';     a[term.LIGHTBLUE]   = 'ansi-lightblue';
    a[term.MAGENTA]     = 'ansi-magenta';  a[term.LIGHTMAGENTA]= 'ansi-lightmagenta';
    a[term.CYAN]        = 'ansi-cyan';     a[term.LIGHTCYAN]   = 'ansi-lightcyan';
    a[term.LIGHTGRAY]   = 'ansi-lightgray';a[term.WHITE]       = 'ansi-white';
    
    a[term.BOLD]        = 'textstyle-bold',
    a[term.UNDERLINE]   = 'textstyle-underline',
    a[term.ITALIC]      = 'textstyle-italic'
}());

window.term = term;

function TermStart() {
    build80x24CharacterMap();
    var buffer = consoleBuffer();
    var handler = consoleHandler();
    var cursor = buildCursor();
    var termPack = TermPack(buffer, handler, cursor);
    TermBlink(cursor, 500, termPack);
    return termPack;

}

function EchoHintsProviderList(list) {
    var allCommands = [].concat(list);
    allCommands.sort();
    return function(prefix) {
        var out = [];
        for (let i=0;i<allCommands.length;i++) {
            var each = allCommands[i];
            if ('' == prefix || each.indexOf(prefix) == 0) {
                out.push(each);
            }
        }

        return out;
    }
}

function EchoHints(hintProvider) {
    var store;
    var ptr;
    
    return {
        Hint: Hint,
        Next: Next
    };

    function Hint(text) {
        store = hintProvider(text);
        ptr = 0;
    }

    function Next() {
        return store[ptr++ % store.length];
    }

}

function EchoHistory(size=1000) {
    var store = [""];
    var ptr = 0;
    
    return {
        Put: Put,
        Prev: Prev,
        Next: Next
    }

    function Put(it) {
        if (store.length >= size) {
            store.splice(0,1);
        }
        store.push(it);
        ptr = store.length;
    }

    function Prev() {
        ptr = boundIn(0, ptr-1, store.length-1);
        return store[ptr];
    }

    function Next() {
        ptr = boundIn(0, ptr+1, store.length-1);
        return store[ptr];
    }

}

function Echo(termPack, onInput, onChange, hardLimit=500) {
    var startPos = [];
    var content = "";
    var editorCursor = 0;
    var cleanupAfterInput;
    var history = null;
    var historyInProgress = false;
    var hintInProgress = false;
    var hints;

    return {
        Start:Start,
        Stop:Stop,
        Reset:Reset,
        GetContent:GetContent,
        SetContent:SetContent,
        UseHistory:UseHistory,
        UseHints:UseHints,
    }
    
    function Start(aCleanupAfterInput=false) {
        cleanupAfterInput = aCleanupAfterInput;
        Reset();
        captureInput();
    }

    function Stop() {
        startPos = null;
        freeInput();
    }

    function Reset() {
        startPos = termPack.GetCursorXY();
        SetContent("");
    }

    function GetContent() {
        return content;
    }

    function SetContent(newContent) {
        content = newContent;
        redraw();
    }

    function UseHistory(aHistory) {
        history = aHistory;
    }

    function UseHints(aHints) {
        hints = aHints;
    }

    function onKeyDown(e) {
        if (canAccept(e) && content.length < hardLimit) {
            putToContent(e.key);
            if (onChange) onChange(content, e);
            redraw();
        }
        else if (e.key == 'Enter') {
            editorCursor = content.length;
            redraw(content.length);
            onEnter();
        }
        else if (canEdit(e.key)) {
            var blanks = content.length;
            performEdit(e.key);
            redraw(blanks);
        }
        else if (canMove(e.key)) {
            performMove(e.key);
            redraw();
        }
        
        if (canHistory(e.key)) {
            var blanks = content.length;
            if (history && !historyInProgress) {
                history.Put(content);
                history.Prev();
                historyInProgress = true;    
            }
            
            performHistory(e.key);
            redraw(blanks);            
        }
        else {
            historyInProgress = false;
        }
        
        if (canHints(e.key)) {
            e.preventDefault();
            var blanks = content.length;
            if (performHint()) {
                redraw(blanks);
            }
        }
        else {
            hintInProgress = false;
        }

    }

    function onEnter() {
        if (cleanupAfterInput) {
            termPack.SetCursorXY(startPos[0], startPos[1]);
            termPack.Print(spacesOnly(content.length));
            termPack.SetCursorXY(startPos[0], startPos[1]);
        }
        else {
            termPack.Print("\n");
        }
        onInput(content);
        if (history) {
            history.Put(content);
        }
        Stop();
    }

    function putToContent(chr) {
        var before = content.substring(0, editorCursor);
        var after = content.substring(editorCursor);
        content = before + chr + after;
        ++editorCursor;
    }

    function canMove(keyName) {
        return ["Home", "End", "ArrowLeft", "ArrowRight"].indexOf(keyName) != -1;
    }

    function performMove(keyName) {
        if ("ArrowLeft" === keyName) {
            --editorCursor;
        }
        else if ("ArrowRight" === keyName) {
            ++editorCursor;
        }
        else if ("Home" === keyName) {
            editorCursor = 0;
        }
        else if ("End" === keyName) {
            editorCursor = content.length;
        }

        editorCursor = boundIn(0, editorCursor, content.length);

    }

    function canHints(keyName) {
        return "Tab" == keyName && hints != null;
    }

    function performHint() {
        if (!hintInProgress) {
            hints.Hint(content);
            hintInProgress = true;
        }

        let nextHint = hints.Next();
        if (nextHint) {
            content = nextHint;
            editorCursor = content.length;

            return true;
        }
    }

    function canHistory(keyName) {
        return history != null && ( ["ArrowUp", "ArrowDown"].indexOf(keyName) !== -1);
    }

    function performHistory(keyName) {
        var value;
        if (keyName === "ArrowUp") {
            value = history.Prev();
        }
        else {
            value = history.Next();
        }

        content = value;
        editorCursor = content.length;
    }

    function canAccept(keyEvent) {
        return !keyEvent.altKey && !keyEvent.ctrlKey && keyEvent.key.length == 1;
    }

    function canEdit(keyName) {
        return ["Backspace","Delete"].indexOf(keyName) != -1;
    }

    function performEdit(keyName) {
        var callDelete = ( "Delete" === keyName );
        if ("Backspace" === keyName && editorCursor > 0) {
            --editorCursor;
            callDelete = true;
        }

        if (callDelete) {
            var before = content.substring(0, editorCursor);
            var after = content.substring(editorCursor+1);
            content = before + after;
        }
    }

    function redraw(blanks=0) {
        termPack.SetCursorXY(startPos[0], startPos[1]);
        termPack.HoldFlush();
        if (blanks > 0) {
            termPack.Print(spacesOnly(blanks));
            termPack.SetCursorXY(startPos[0], startPos[1]);
        }
        var beforeCursor = content.substring(0, editorCursor);
        var afterCursor = content.substring(editorCursor);
        termPack.Print(beforeCursor);
        var cursorPos = termPack.GetCursorXY();
        startPos[1] -= termPack.GetRecentRotates();
        termPack.Print(afterCursor);
        termPack.SetCursorXY(cursorPos[0], cursorPos[1]);
        startPos[1] -= termPack.GetRecentRotates();
        termPack.Flush();
    }

    function captureInput() {
        window.addEventListener('keydown', onKeyDown);
    }

    function freeInput() {
        window.removeEventListener('keydown', onKeyDown);
    }
}

function TermPack(buffer, handler, cursor) {
    var rotateCount = 0;
    var cursorPos = [1,1];
    var useFlush = true;
    var self = {
        cursorHidden: false,

        EmptyBuffer: EmptyBuffer,
        PutBuffer: PutBuffer,
        CloneBuffer,CloneBuffer,
        Print: Print, Println: Println, HoldFlush: HoldFlush, GetCursorXY: GetCursorXY, 
        SetCursorXY: SetCursorXY, GetCharXY:GetCharXY, GetColorXY:GetColorXY, Flush: Flush,
        ShowCursor: ShowCursor, HideCursor: HideCursor,
        GetRecentRotates:GetRecentRotates
    }
    return self;

    function PutBuffer(bitmap, idx1X, idx1Y, srcLeft=0, srcTop=0, aSrcRight=-1, aSrcBottom=-1) {
        var srcRight = aSrcRight != -1 ? aSrcRight : bitmap.w;
        var srcBottom = aSrcBottom != -1 ? aSrcBottom : bitmap.h;

        TermPutBuffer(bitmap, srcLeft, srcTop, srcRight, srcBottom, buffer, idx1X-1, idx1Y-1);
        if (useFlush) {
            Flush();
        }
    }

    function CloneBuffer() {
        return TermCloneBuffer(buffer);
    }

    function GetRecentRotates() {
        return rotateCount;
    }

    function EmptyBuffer() {
        buffer = consoleBuffer();
    }

    function ShowCursor() {
        self.cursorHidden = false;
        TermToggleVisible(cursor, self);
    }

    function HideCursor() {
        self.cursorHidden = true;
        TermToggleVisible(cursor, self);
    }

    function SetCursorXY(x,y) {
        var nX = boundIn(1, x, 80);
        var nY = boundIn(1, y, 24);
        cursorPos = [nX,nY];
    }

    function GetCharXY(x,y) {
        return buffer.chars[y-1][x-1];
    }

    function GetColorXY(x,y) {
        return buffer.colors[y-1][x-1];
    }

    function GetCursorXY() {
        return [].concat(cursorPos);
    }

    function HoldFlush() {
        useFlush = false;
    }

    function Println(text, optionalColor=[]) {
        return Print(text+"\n", optionalColor);
    }

    function Print(text, optionalColor=[]) {
        rotateCount = 0;
        var lastTail = 0;
        for (var i=0; i<text.length; i++) {
            var newLine = ( text.charAt(i) === '\n' );
            var endOfLine = cursorPos[0] + i - lastTail == 80;
            
            if (newLine || endOfLine) {
                var renderCurrentChar = (endOfLine ? 1:0);
                var toRender = text.substring(lastTail, i + renderCurrentChar );
                lastTail = i+1;
                
                TermWrite(buffer, cursorPos[0], cursorPos[1], toRender, optionalColor);

                if (cursorPos[1] == 24) {
                    ++rotateCount;
                    consoleBufferRotate(buffer);
                }
                else {
                    ++cursorPos[1];
                }
                cursorPos[0] = 1;
            }
        }

        if (lastTail < text.length) {
            var trailingText = text.substring(lastTail);
            TermWrite(buffer, cursorPos[0], cursorPos[1], trailingText, optionalColor);
            cursorPos[0] += trailingText.length;
        }

        if (useFlush) {
            Flush();
        }
    }

    function Flush() {
        useFlush = true;
        TermFlush(handler, buffer);
        TermCursorTo(cursor, handler, buffer, cursorPos[0], cursorPos[1]);
    }
}

function TermMapBuffer(mapper, srcBuffer, srcLeft, srcTop, srcRight, srcBottom, destBuffer, destLeft, destTop) {
    var srcChars = srcBuffer.chars;
    var srcColors = srcBuffer.colors;
    var destChars = destBuffer.chars;
    var destColors = destBuffer.colors;
 
    var width = srcRight-srcLeft;
    var height = srcBottom-srcTop;

    for (var y=0;y<height;y++) {
        for (var x=0;x<width;x++) {
            var srcChar = srcChars[y+srcTop][x+srcLeft];
            var srcColor = srcColors[y+srcTop][x+srcLeft];
            var destChar = destChars[y+destTop][x+destLeft];
            var destColor = destColors[y+destTop][x+destLeft];

            var mappedPair = mapper(srcChar, [].concat(srcColor), destChar, destColor);

            destChars[y+destTop][x+destLeft] = mappedPair[0];
            destColors[y+destTop][x+destLeft] = mappedPair[1];
        }
    }
}

function TermPutBuffer(srcBuffer, srcLeft, srcTop, srcRight, srcBottom, destBuffer, destLeft, destTop) {
    TermMapBuffer(copyCharAndColor, srcBuffer, srcLeft, srcTop, srcRight, srcBottom, destBuffer, destLeft, destTop);

    function copyCharAndColor(chr, color) {
        return [chr, color];
    }
}

function TermWrite(buffer,iX,iY,text, textColors=[]) {
    var x = iX -1;
    var y = iY -1;

    var chars = buffer.chars;
    var colors = buffer.colors;
    if (y >= chars.length || y < 0) {
        return;
    }

    var line = chars[y];
    var colorLine = colors[y];
    var topX = Math.min(line.length, x + text.length);

    for (var i=x;i<topX;i++) {
        line[i] = text.charAt(i-x);
        for (var j=0;j<textColors.length;j++) {
            if (textColors[j]) {
                colorLine[i][j] = textColors[j]; 
            }    
        }
    }
}

function TermFlush(handler, buffer) {
    var chars = buffer.chars;
    var colors = buffer.colors;

    for (var y=0;y<24;y++) {
        for (var x=0;x<80;x++) {
            var each = handler[y][x];
            each.innerHTML = chars[y][x];
            each.className = cssClassNameFromAnsii(colors[y][x]);
        }
    }
}

function TermCursorTo(cursor, handler, buffer, aX,aY) {
    var x = aX-1;
    var y = aY-1;
    var charBox = handler[y][x];
    var rect = charBox.getBoundingClientRect();
    
    var px = 'px';

    var cursorRatio = 0.1;

    var cursorHeight = Math.max(1, rect.height*cursorRatio);

    cursor.style.width = rect.width + px;
    cursor.style.height = cursorHeight + px;
    cursor.style.left = rect.x + px;
    cursor.style.top = rect.height - cursorHeight + rect.y + px;
    
    var frontColor = buffer.colors[y][x][0];
    
    cursor.className = cssClassNameFromAnsii( [frontColor, frontColor]);

}

function TermBlink(what, delay, termPack) {
    setInterval(function() {
        TermToggleVisible(what, termPack.cursorHidden);
    }, delay);
}

function TermToggleVisible(what, forceHidden) {
    if (forceHidden) {
        what.style.visibility = 'hidden';
        return;
    }

    if (what.style.visibility == 'hidden') {
        what.style.visibility = 'visible';
    }
    else {
        what.style.visibility = 'hidden';
    }
}

function cssClassNameFromAnsii(frontAndBackColorAndStyles) {
    var frontColor = "FG-"+ansiToCSS[frontAndBackColorAndStyles[0]];
    var backColor = "BG-"+ansiToCSS[frontAndBackColorAndStyles[1]];

    var optionalStyles = [];
    for (var i=2;i<frontAndBackColorAndStyles.length;i++) {
        optionalStyles.push(ansiToCSS[frontAndBackColorAndStyles[i]]);
    }
    
    return frontColor+" "+backColor+" "+optionalStyles.join(" ");
}

function randomColor() {
    return randomOf(colors);
}

function randomOf(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
}

function randomNum(N) {
    return Math.floor(Math.random()*N);
}

function stringToArr(src) {
    var arr = [];
    for (var i=0;i<src.length;i++) {
        arr.push(src.charAt(i));
    }

    return arr;
}

function build80x24CharacterMap() {
    var term = document.getElementById("term");
    for (var y=0;y<24;y++) {
        for (var x=0;x<80;x++) {
            term.appendChild(createCharacter(x,y));
        }
        term.appendChild(createNewLine());
    }
}

function createCharacter(x,y) {
    var character = document.createElement("span");
    character.setAttribute("id", characterIdFor(x,y));
    character.innerHTML = ' ';
    return character;
}

function createNewLine() {
    var newLine = document.createTextNode("\n");
    return newLine;
}

function characterIdFor(x,y) {
    return "term-char-"+x+"x"+y;
}

function consoleHandler() {
    var lines = [];
    for (var y=0;y<24;y++) {
        var row = [];
        lines.push(row);
        for (var x=0;x<80;x++) {
            row.push(document.getElementById(characterIdFor(x,y)));
        }
    }

    return lines;
}

function buildCursor() {
    var cursor = document.createElement("div");
    cursor.setAttribute('id', 'cursor');
    document.getElementById('term').appendChild(cursor);
    cursor.style.position = 'absolute';

    return cursor;
    
}

function consoleBuffer() {
    return TermBuffer(80,24);
}

function TermBuffer(width,height) {
    var characters = [];
    var colors = [];

    for (var y=0;y<height;y++) {
        var linePair = consoleBufferLine(width);
        characters.push(linePair[0]);
        colors.push(linePair[1]);
    }

    return {chars: characters, colors:colors, w:width, h:height}
}

function TermCloneBuffer(src) {
    var dest = TermBuffer(src.w, src.h);
    TermPutBuffer(src, 0, 0, src.w, src.h, dest, 0,0);

    return dest;
}

function consoleBufferRotate(buffer) {
    var chars = buffer.chars;
    var colors = buffer.colors;

    chars.splice(0, 1);
    colors.splice(0, 1);

    var linePair = consoleBufferLine();
    chars.push(linePair[0]);
    colors.push(linePair[1]);
}

function consoleBufferLine(w=80) {
    var line = [];
    var colorLine = [];
    for (var x=0;x<w;x++) {
        line.push(' ');
        colorLine.push([term.LIGHTGRAY,term.BLACK]);
    }

    return [line, colorLine]
}

function spacesOnly(n) {
    var out = "";
    for (var i=0;i<n;i++) {
        out+=" ";
    }

    return out;
}

function boundIn(min,what,max) {
    return Math.max(min, Math.min(what, max));
}
window.addEventListener('load', start);

var term = {
    BLACK       : 30,        GRAY        :90,
    RED         : 31,        LIGHTRED    :91,
    GREEN       : 32,        LIGHTGREEN  :92,
    YELLOW      : 33,        LIGHTYELLOW :93,
    BLUE        : 34,        LIGHTBLUE   :94,
    MAGENTA     : 35,        LIGHTMAGENTA:95,
    CYAN        : 36,        LIGHTCYAN   :96,
    LIGHTGRAY   : 37,        WHITE       :97
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
    
}());

window.term = term;

function start() {
    build80x24CharacterMap();
    var buffer = consoleBuffer();
    var handler = consoleHandler();
    var cursor = buildCursor();

    TermWrite(buffer, 1,1,"Hello #>");
    TermWrite(buffer, 1,2,">> Welcome to THEME PARK << ");
    TermFlush(handler, buffer);
    TermCursorTo(cursor, handler, buffer, 1,1);
    TermBlink(cursor, 500);

    var t = TermPack(buffer, handler, cursor);
    
    t.HoldFlush();
    t.Print("Welcome to ");
    t.Print("TERM Engine", [term.LIGHTGREEN, term.GREEN]);
    t.Print(" demo\nHint: 'help' is a good command to start with\n\n");
    t.Print("#>");
    t.Flush();
    console.log(t.GetCharXY(1,1));
    console.log(t.GetColorXY(1,1));
}

function TermPack(buffer, handler, cursor) {
    var cursorPos = [1,1];
    var useFlush = true;
    return {
        Print: Print, HoldFlush: HoldFlush, GetCursorXY: GetCursorXY, SetCursorXY: SetCursorXY, GetCharXY,
        GetColorXY, Flush: Flush,
    }

    function SetCursorXY(x,y) {
        var nX = Math.max(1,Math.min(80,x));
        var nY = Math.max(1,Math.min(24,x));
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

    function Print(text, optionalColor=[]) {
        var lastTail = 0;
        for (var i=0; i<text.length; i++) {
            var newLine = ( text.charAt(i) === '\n' );
            var endOfLine = cursorPos[0] + i - lastTail == 80;
            
            if (newLine || endOfLine) {
                var renderCurrentChar = (endOfLine ? 1:0);
                var toRender = text.substr(lastTail, i-lastTail + renderCurrentChar );
                lastTail = i+1;
                
                TermWrite(buffer, cursorPos[0], cursorPos[1], toRender, optionalColor);

                if (cursorPos[1] == 24) {
                    consoleBufferRotate(buffer);
                }
                else {
                    ++cursorPos[1];
                }
                cursorPos[0] = 1;
            }
        }

        if (lastTail < text.length) {
            var trailingText = text.substr(lastTail);
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
        if (textColors[0]) {
            colorLine[i][0] = textColors[0]; 
        }
        if (textColors[1]) {
            colorLine[i][1] = textColors[1];
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

function TermBlink(what, delay) {
    setInterval(function() {
        if (what.style.visibility == 'hidden') {
            what.style.visibility = 'visible';
        }
        else {
            what.style.visibility = 'hidden';
        }
    }, delay);
}

function cssClassNameFromAnsii(frontAndBackColor) {
    return "FG-"+ansiToCSS[frontAndBackColor[0]]+" "+"BG-"+ansiToCSS[frontAndBackColor[1]];
}

function randomColor() {
    return randomOf(colors);
}

function randomOf(arr) {
    return arr[Math.floor(Math.random()*arr.length)];
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
    var characters = [];
    var colors = [];

    for (var y=0;y<24;y++) {
        var linePair = consoleBufferLine();
        characters.push(linePair[0]);
        colors.push(linePair[1]);
    }

    return {chars: characters, colors:colors}
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

function consoleBufferLine() {
    var line = [];
    var colorLine = [];
    for (var x=0;x<80;x++) {
        line.push(' ');
        colorLine.push([term.WHITE,term.BLACK]);
    }

    return [line, colorLine]
}


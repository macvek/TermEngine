window.addEventListener('load', demoApp);

function demoApp() {
    var t = TermStart();
    
    t.HoldFlush();

    //showPrompt();
    callCommand("snake");

    function welcomeScreen() {
        clearConsole();
        t.Print("Welcome to ");
        t.Print("TERM Engine", [term.LIGHTGREEN, term.GREEN]);
        t.Print(" demo\nHint: 'help' is a good command to start with\n\n");
        showPrompt();
    }

    function showPrompt() {
        t.Print("#>");
        t.Flush();
        readLine();
    }

    function readLine() {
        var echo = new Echo(t, c => {
            if (callCommand(c)) {
                showPrompt();
            }
        });
        echo.Start();
    }

    function callCommand(cmd) {
        if (cmd === "help") {
            showHelp();
        }
        else if (cmd === "cls") {
            clearConsole();
        }
        else if (cmd === "matrix") {
            clearConsole();
            matrixDemo();
            return false;
        }
        else if (cmd === "minesweeper") {
            clearConsole();
            minesweeperDemo();
            return false;
        }
        else if (cmd === "snake") {
            clearConsole();
            snakeDemo();
            return false;
        }

        return true;
    }

    function matrixDemo() {
        var echo = new Echo(t, c => {
           t.showCursor();
           clearInterval(matrixLoop);
           welcomeScreen();
        });
        echo.Start();

        t.hideCursor();
        var matrixLoop = setInterval(matrixOnScreen, 1000/30);
        var points = [];
        var chars = stringToArr("!@#$%^&*()+-=!@#[]\\/|?");

        function matrixOnScreen() {
            if (Math.random() > 0.001) {
                points.push(nextPoint());
            }
            
            t.HoldFlush();
            var newPoints = [];
            for (var i=0;i<points.length;i++) {
                var each = points[i];
                each.draw();
                if (each.alive()) {
                    newPoints.push(each);
                }
            }
            t.Flush();
            t.EmptyBuffer();
            points = newPoints;
        }

        function nextPoint() {
            var xy = [randomNum(80), randomNum(24)];
            var trace = [];
            var stageSpeed = randomNum(10) + 10;
            var stageTime = stageSpeed;
            return {
                draw: function() {
                    for (var i=0;i<trace.length;i++) {
                        var posY = xy[1]+i;
                        if (posY > 24) {break};
                        t.SetCursorXY(xy[0], posY);
                        var color;
                        if (trace.length - i > 8) {
                            color = term.GRAY;
                        }
                        else if (trace.length - i > 5) {
                            color = term.LIGHTGRAY;
                        }
                        else if (trace.length - i > 1) {
                            color = term.GREEN;
                        }

                        t.Print(trace[i], [color]);
                    }

                    var posY = xy[1]+trace.length;
                   
                    var randomChar = randomOf(chars);
                    if (posY <= 24) {
                        t.SetCursorXY(xy[0],posY);
                        t.Print(randomChar, [term.LIGHTGREEN]);
                    }

                    --stageTime;
                    if (stageTime < 0) {
                        stageTime = stageSpeed;
                        trace.push(randomChar);
                    }    
                    
                },
                alive: function() {
                    return xy[1] + trace.length < 40;
                }
            };
        }

    }

    function minesweeperDemo() {
        t.hideCursor();

        var gameSettled;
        var gameResult;
        var cursorXY = [0,0];
        var mapOffset = [32,8];
        var mapSize = [18,10];

        var fields;
        var fog;

        var termCursorXY = t.GetCursorXY();
        var currentColors = t.GetColorXY(termCursorXY[0], termCursorXY[1]);

        resetGame();
        window.addEventListener('keydown', onKey);

        function resetGame() {
            gameSettled = false;
            prepareFields();
            redraw();
        }

        function gameLost() {
            gameSettled = true;
            gameResult = false;
            dropFog();
        }

        function gameWon() {
            gameSettled = true;
            gameResult = true;
            dropFog();
        }

        function dropFog() {
            for (var y=0;y<mapSize[1];y++) 
            for (var x=0;x<mapSize[0];x++){
                fog[y][x] = false;
            }
        }

        function onlyMinesHidden() {
            for (var y=0;y<mapSize[1];y++)
            for (var x=0;x<mapSize[0];x++) {
                if (fog[y][x] && fields[y][x] !== '*') {
                    return false;
                }
            }

            return true;
        }

        function redraw() {
            t.HoldFlush();
            drawInfoboard();
            drawMap();
            drawFields();
            drawCursor();
            t.Flush();
        }

        function drawInfoboard() {
            var winMessage   = "       VICTOR       ";
            var lostMessage  = "       LOSSER       ";
            var noMessage = "                    ";

            var inGameKeys  = "          (ESC) to quit          ";
            var afterGame   = "(ESC) to quit, (ENTER) to restart";

            var winColor = [term.LIGHTGREEN, term.GREEN];
            var lostColor = [term.BLACK, term. RED];

            t.SetCursorXY(31, 5);
            if (gameSettled) {
                var msg = gameResult ? winMessage : lostMessage;
                var color = gameResult ? winColor : lostColor;
                t.Print(msg, color);
            }            
            else {
                t.Print(noMessage, [term.BLACK, term.BLACK]);
            }

            t.SetCursorXY(24, 22);
            t.Print(gameSettled ? afterGame : inGameKeys, [term.LIGHTGRAY, term.BLACK])
        }

        function drawMap() {
            t.SetCursorXY(31, 7);    t.Print("┌──────────────────┐", currentColors);
            t.SetCursorXY(31, 8);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31, 9);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,10);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,11);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,12);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,13);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,14);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,15);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,16);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,17);    t.Print("│                  │", currentColors);
            t.SetCursorXY(31,18);    t.Print("└──────────────────┘", currentColors);
        }

        function drawFields() {
            var offX = mapOffset[0];
            var offY = mapOffset[1];
            
            var indexes = " 12345678";
            var colors = 
                [   [term.WHITE, term.BLACK] // 0 - space
                    [term.BLUE, term.BLACK], // 1
                    [term.GREEN, term.BLACK], // 2
                    [term.CYAN, term.BLACK], // 3
                    [term.MAGENTA, term.BLACK], // 4
                    [term.LIGHTBLUE, term.BLACK], // 5
                    [term.LIGHTGREEN, term.BLACK], // 6
                    [term.LIGHTCYAN, term.BLACK], // 7
                    [term.LIGHTMAGENTA, term.BLACK] // 8
                ];
            var mineColor = gameResult ? [term.LIGHTGREEN] : [term.LIGHTRED];
            var grayColor = [term.GRAY, term.BLACK];

            for (var y=0;y<mapSize[1];y++)
            for (var x=0;x<mapSize[0];x++) {
                var field = fields[y][x];
                var fogged = fog[y][x];
                t.SetCursorXY(x+offX,y+offY);
                if (fogged) {
                    t.Print('#', grayColor);
                }
                else {
                    if (gameSettled) {
                        if (field === '*') {
                            t.Print('*', mineColor);
                        }
                        else {
                            t.Print(field, grayColor);
                        }
                    }
                    else {
                        var colorIdx = indexes.indexOf(field);
                        if (colorIdx == -1) {
                            throw "Found not matching index for "+field+" on xy:"+x+","+y;
                        }
                        t.Print(field, colors[colorIdx]);
                    }
                }
            }
        }

        function drawCursor() {
            var posX = mapOffset[0] + cursorXY[0];
            var posY = mapOffset[1] + cursorXY[1];
            var colors = t.GetColorXY(posX, posY);
            var chr = t.GetCharXY(posX, posY);
            t.SetCursorXY(posX,posY);
            t.Print(chr, [colors[1], colors[0]]);
        }

        function resolveField(x,y) {
            if (!fog[y][x]) {
                return;
            }

            fog[y][x] = false;
            var field = fields[y][x];
            if (field === '*') {
                gameLost();
                return;
            }
            else if (field === ' ') {
                var pairs = allNeighbours(x,y);
                for (var i=0;i<pairs.length;i++) {
                    var p = pairs[i];
                    resolveField(p[0], p[1]);
                }
            }

            if (onlyMinesHidden()) {
                gameWon();
            }
        }

        function prepareFields() {
            var mines = 20;
            fields = [];
            fog = [];
            for (var y=0;y<mapSize[1];y++) {
                fields.push(new Array(mapSize[0]));
                var fogged = [];
                fog.push(fogged);
                for (var x=0;x<mapSize[0];x++) {
                    fogged.push(true);
                }
            }

            var fieldsCount = mapSize[0]*mapSize[1];
            if (mines >= fieldsCount) {
                throw "General error; cannot have more mines than all fields!";
            }
            var indexes = [];
            for (var i=0;i<mines;i++) {
                var idx = randomNum(fieldsCount);
                while(indexes.indexOf(idx) != -1) {
                    idx = ( idx + 1 ) % fieldsCount;
                }

                indexes.push(idx);
            }

            for (var i=0;i<indexes.length;i++) {
                var idx = indexes[i];
                var x = idx % mapSize[0];
                var y = Math.floor(idx/mapSize[0]);
                fields[y][x] = '*';
            }

            for (var y=0;y<mapSize[1];y++)
            for (var x=0;x<mapSize[0];x++) {
                calcMinesForField(x,y);
            }
        }

        function allNeighbours(x,y) {
            var pairs = [];
            for (var nY=y-1;nY<=y+1;nY++)
            for (var nX=x-1;nX<=x+1;nX++) {
                if ( !(nY == y && nX == x) && nY >= 0 && nY < mapSize[1] && nX >= 0 && nX < mapSize[0]) {
                    pairs.push([nX,nY]);
                }
            }
            return pairs;
        }

        function calcMinesForField(x,y) {
            if (fields[y][x] === '*') {
                return;
            }

            var count = 0;
            var neighbours = allNeighbours(x,y);
            for (var i=0;i<neighbours.length;i++) {
                var nX = neighbours[i][0];
                var nY = neighbours[i][1];
                
                if ( fields[nY][nX] === '*') {
                    ++count;
                }
            }

            var txt = count > 0 ? ''+count : ' ';
            fields[y][x] = txt;
            return txt;
        }

        function onKey(e) {
            
            if ( ["Escape"].indexOf(e.key) != -1) {
                window.removeEventListener('keydown', onKey);
                t.showCursor();
                welcomeScreen();
            }
            else if ( gameSettled && ["Enter"].indexOf(e.key) != -1) {
                resetGame();
            }
            
            var callRedraw = true;
            if ("ArrowDown" === e.key) {
                ++cursorXY[1];
            }
            else if ("ArrowUp" === e.key) {
                --cursorXY[1];
            }
            else if ("ArrowLeft" === e.key) {
                --cursorXY[0];
            }
            else if ("ArrowRight" === e.key) {
                ++cursorXY[0];
            }
            else if (" " === e.key) {
                if (!gameSettled) {
                    resolveField(cursorXY[0], cursorXY[1]);
                }
            }
            else {
                callRedraw = false;
            }

            if (callRedraw) {
                cursorXY[0] = boundIn(0, cursorXY[0], mapSize[0]-1);
                cursorXY[1] = boundIn(0, cursorXY[1], mapSize[1]-1);
                redraw();
            }
        }
    }

    function snakeDemo() {
        var snakeHead;
        var snakeMove;
        
        var snakePoints;
        var snakeLength;

        var collectPoints;
        var newCollectPointTimer;

        function reset() {
            snakeHead = [40,10];
            snakeMove = [1,0];
        
            snakePoints = [];
            snakeLength = 15;

            collectPoints = [];
            newCollectPointTimer = 10;
        }

        var loopHandler;
        
        reset();
        startGame();

        function startGame() {
            t.hideCursor();
            captureInput();
            loopHandler = setInterval(loop, 100);
        }

        function stopGame() {
            dropInput();
            clearInterval(loopHandler);
            t.showCursor();
            welcomeScreen();
        }

        function captureInput() {
            window.addEventListener('keydown', onKey);
        }

        function dropInput() {
            window.removeEventListener('keydown', onKey);
        }

        function onKey(e) {
            var lastMove = [].concat(snakeMove);
            switch (e.key) {
                case "ArrowLeft"    : snakeMove = [-1,0]; break;
                case "ArrowRight"   : snakeMove = [1,0]; break;
                case "ArrowUp"      : snakeMove = [0,-1]; break;
                case "ArrowDown"    : snakeMove = [0,1]; break;
                case "Escape"       : stopGame(); break;
            }

            if (lastMove[0]+snakeMove[0] === 0 && lastMove[1]+snakeMove[1] === 0) {
                snakeMove = lastMove;
            }
        }

        function loop() {
            frame();
            draw();
        }
       

        function frame() {
            if (!canMove()) {
                reset();
                return;
            }
            putPoint();
            moveSnake();

            checkCollectPoints();
            newCollectPoint();

            while(snakePoints.length > snakeLength) {
                cutPoint();
            }
        }

        function checkCollectPoints() {
            var newPoints = [];
            for (var i=0;i<collectPoints.length;i++) {
                var each = collectPoints[i];
                if (snakeHead[0] == each.x && snakeHead[1] == each.y) {
                    snakeLength += 1;
                }
                else if (--each.t > 0) {
                    newPoints.push(each);
                }
            }

            collectPoints = newPoints;
        }

        function newCollectPoint() {
            if (--newCollectPointTimer < 0 && collectPoints.length < 10) {
                newCollectPointTimer = 10;
                var collectPoint = {};
                collectPoint.x = randomNum(80);
                collectPoint.y = randomNum(24);
                collectPoint.t = 50 + randomNum(50);

                collectPoints.push(collectPoint);
            }
        }

        function draw() {
            t.HoldFlush();
            t.EmptyBuffer();
            for (var i=0;i<collectPoints.length;i++) {
                var point = collectPoints[i];
                t.SetCursorXY(point.x+1, point.y+1);
                t.Print('o');
            }

            for (var i=0;i<snakePoints.length;i++) {
                var point = snakePoints[i];
                t.SetCursorXY(point[0]+1, point[1]+1);
                t.Print('x');
            }

            t.SetCursorXY(snakeHead[0]+1, snakeHead[1]+1);
            t.Print('X');

            t.Flush();
        }

        function putPoint() {
            var point = [].concat(snakeHead);
            snakePoints.push(point);
        }

        function cutPoint() {
            snakePoints.splice(0,1);
        }

        function moveSnake() {
            snakeHead[0] = (80 + snakeHead[0] + snakeMove[0]) % 80;
            snakeHead[1] = (24 + snakeHead[1] + snakeMove[1]) % 24;
        }

        function canMove() {
            for (var i=0;i<snakePoints.length;i++) {
                var each = snakePoints[i];
                if (each[0] === snakeHead[0] && each[1] === snakeHead[1]) {
                    return false;
                }
            }

            return true;
        }

    }

    function showHelp() {
        t.Println("##         HELP         ##", [term.WHITE, term.GRAY]);
        t.Println("cls - Clear screen");
        t.Println("matrix - brunette blondes and red");
        t.Println("minesweeper");
        t.Println("snake");
        t.Println("##                      ##", [term.WHITE, term.GRAY]);
    }

    function clearConsole() {
        t.HoldFlush();
        t.SetCursorXY(1,24);
        for (var i=0;i<24;i++) {
            t.Println("");
        }
        t.SetCursorXY(1,1);
        t.Flush();
    }

   
}
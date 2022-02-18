window.addEventListener('load', demoApp);

function demoApp() {
    var t = TermStart();
    
    t.HoldFlush();
    t.Print("Welcome to ");
    t.Print("TERM Engine", [term.LIGHTGREEN, term.GREEN]);
    t.Print(" demo\nHint: 'help' is a good command to start with\n\n");

    //showPrompt();
    callCommand('minesweeper');

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

        return true;
    }

    function matrixDemo() {
        var echo = new Echo(t, c => {
           t.showCursor();
           clearInterval(matrixLoop);
           clearConsole();
           t.Println("Matrix demo is over, you are free to type more");
           showPrompt();

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

        var cursorXY = [0,0];
        var mapOffset = [32,8];
        var mapSize = [18,10];

        var termCursorXY = t.GetCursorXY();
        var currentColors = t.GetColorXY(termCursorXY[0], termCursorXY[1]);

        redraw();
        window.addEventListener('keydown', onKey);

        function redraw() {
            t.HoldFlush();
            drawMap();
            drawCursor();
            t.Flush();
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

        function drawCursor() {
            var posX = mapOffset[0] + cursorXY[0];
            var posY = mapOffset[1] + cursorXY[1];
            var colors = t.GetColorXY(posX, posY);
            var chr = t.GetCharXY(posX, posY);
            t.SetCursorXY(posX,posY);
            t.Print(chr, [colors[1], colors[0]]);
        }

        
        function onKey(e) {
            
            if ( ["Escape","Enter"].indexOf(e.key) != -1) {
                window.removeEventListener('keydown', onKey);
                t.showCursor();
                clearConsole();
                showPrompt();
            }
            
            var callRedraw = false;
            if ("ArrowDown" === e.key) {
                ++cursorXY[1];
                callRedraw = true;
            }
            else if ("ArrowUp" === e.key) {
                --cursorXY[1];
                callRedraw = true;
            }
            else if ("ArrowLeft" === e.key) {
                --cursorXY[0];
                callRedraw = true;
            }
            else if ("ArrowRight" === e.key) {
                ++cursorXY[0];
                callRedraw = true;
            }

            if (callRedraw) {
                cursorXY[0] = boundIn(0, cursorXY[0], mapSize[0]-1);
                cursorXY[1] = boundIn(0, cursorXY[1], mapSize[1]-1);
                redraw();
            }
        }
    }

    function showHelp() {
        t.Println("##         HELP         ##", [term.WHITE, term.GRAY]);
        t.Println("cls - Clear screen");
        t.Println("matrix - brunette blondes and red");
        t.Println("minesweeper");
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
window.addEventListener('load', demoApp);

function demoApp() {
    var t = TermStart();
    
    t.HoldFlush();
    t.Print("Welcome to ");
    t.Print("TERM Engine", [term.LIGHTGREEN, term.GREEN]);
    t.Print(" demo\nHint: 'help' is a good command to start with\n\n");

    showPrompt();

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

    function showHelp() {
        t.Println("##         HELP         ##", [term.WHITE, term.GRAY]);
        t.Println("cls - Clear screen");
        t.Println("matrix - brunette blondes and red");
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
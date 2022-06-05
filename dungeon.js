window.addEventListener('load', dungeon);

function dungeon() {
    var t = TermStart();
    var Focuses = toAtoms(['PLAYER', 'DIALOG'])
    var ActivateResults = toAtoms(['MOVE','ABORT','STOP']);
    var keyFocus;
    var map;

    window.addEventListener('keydown', onPlayerMove);
    var player;

    var radius = 60;
    var viewMap = buildViewMap(radius);
    var shadeColor = term.GRAY;
    var neverSeenSymbol = specialChars.LIGHTSHADE;
    var alreadySeenSymbol = '~';

    initLevel();
    redraw();

    function initLevel() {
        t.HideCursor();

        player = EntityPlayer();
        map = initMap();
        keyFocus = Focuses.PLAYER
        drawOnMap([
            "                                                                                ",
            "        ########                                                                ",
            "        #                                                                       ",
            "        #     ##                                                                ",
            "        #     #                       @                  S                      ",
            "        #######                                                                 ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                   ########## #####                                             ",
            "                   #              #                                             ",
            "                   #              #                                             ",
            "                   #              #                                             ",
            "                   ###### #########                                             ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "                                                                                ",
            "        B                                              #########################",
            "                                                       #                        ",
            "                                                       #                        ",
            "                                                       #                        ",
        ]);
    }

    function drawOnMap(lines) {
        for (var y=0;y<lines.length;y++) 
        for (var x=0;x<lines[y].length;x++) {
            var chr = lines[y].charAt(x);
            var pos = [x+1,y+1];
            if ("#" === chr) {
                putStatic(EntityWall());
            }
            else {
                putStatic(EntityFloor());
            }

            if ("@" === chr) {
                putEnt(player);
            }
            else if ("S" === chr) {
                putEnt(EntityZombieSpawn());
            }
            else if ("B" === chr) {
                putEnt(EntityMonsterSpawn());
            }

        }

        function putEnt(ent) {
            map.put(pos, ent);
        }

        function putStatic(ent) {
            map.statics.put(pos, ent);
        }
    }

    function EntityPlayer() {
        var ent = dynamicObject('@','Player', activatePlayer);
        ent.color = term.WHITE;

        return ent;
    }

    function EntityMonster() {
        return dynamicObject('B', 'Monster', activateAttack, monsterTurn);
    }

    function EntityZombie() {
        return dynamicObject('U', 'Zombie', activateAttack, zombieTurn);
    }

    function EntityWall() {
        var wall = dynamicObject('#', 'Wall', activateAbort);
        wall.blocksSight = true;
        wall.symbolAndColor = drawFuncShowShadeIfEverSeen;
        return wall;
    }

    function EntityFloor() {
        var floor = dynamicObject(' ', 'Floor');
        floor.symbolAndColor = createDrawFuncFor2Faces(' ', alreadySeenSymbol);
        return floor;
    }
    
    function EntityZombieSpawn() {
        return dynamicObject(null, 'ZombieSpawn', activateMove, zombieSpawnTurn);
    }

    function EntityMonsterSpawn() {
        return dynamicObject(null, 'MonsterSpawn', activateMove, monsterSpawnTurn);
    }

    function dynamicObject(symbol, name, onActivate, onTurn) {
        var drawFunc = symbol ? drawFuncShowIfVisible : drawFuncInvisible;
        return {
            pos: [-1,-1],
            symbol:symbol,
            color: term.LIGHTGRAY,
            name: name,
            onActivate: onActivate,
            onTurn: onTurn,
            blocksSight: false,
            inSight: false,
            everInSight:false,
            symbolAndColor: drawFunc
        }
    }

    function drawFuncInvisible() {
        return [];
    }

    function createDrawFuncFor2Faces(vis, hidden) {
        return function() {
            this.symbol = this.inSight ? vis : hidden;
            return drawFuncShowShadeIfEverSeen.apply(this);
        }
    }

    function drawFuncShowIfVisible() {
        return this.inSight ? [this.symbol, this.color] : []
    }

    function drawFuncShowShadeIfEverSeen() {
        if (this.inSight) {
            return [this.symbol, this.color];
        }
        if (this.everInSight) {
            return [this.symbol, shadeColor];
        }
        
        return [];
    }

    function initMap() {
       
        return {
            bounds:{ minX:1, maxX:80, minY:1, maxY:24 },
            objects: [],
            statics: indexedObjects(),
            positions: indexedObjects(),
            getAll: function(where) {
                return this.positions.get(where).concat(this.statics.get(where));
            },
            put: function(where, what) {
                this.objects.push(what);
                this.positions.put(where, what)
            },
            remove: function(what) {
                arrayDrop(this.objects, what);
                this.positions.remove(what);
            }
        }
    }

    function iterateOverMap(callback) {
        for (var y=map.bounds.minY; y<=map.bounds.maxY;y++)
        for (var x=map.bounds.minX; x<=map.bounds.maxX;x++) {
            callback(x,y);
        }
    }

    function indexedObjects() {
        return {
            rows: [],
            getOne: function(pos) {
                var ret = this.get(pos);
                if (ret.length != 1) {
                    console.error("Expected one item", [pos, ret]);
                }
                return ret[0];
            },
            get: function(pos) {
                var y = pos[1];
                var x = pos[0];
                if (this.rows[y] && this.rows[y][x]) {
                    return this.rows[y][x];
                }
                else {
                    return [];
                }
            },
            put: function(pos,what) {
                var y = pos[1];
                var x = pos[0];
                var row = this.rows[y];
                if (!row) {
                    row = [];
                    this.rows[y] = row;
                }

                var col = row[x];
                if (!col) {
                    col = [];
                    row[x] = col;
                }

                col.push(what);
                what.pos = pos;
            },
            move: function(pos,what) {
                this.remove(what);
                this.put(pos, what);
            },
            remove: function(what) {
                var list = this.get(what.pos);
                arrayDrop(list, what);
            }
        }
    }

    function mapInBounds(pos) {
        return pos[0] >= map.bounds.minX && pos[0] <= map.bounds.maxX 
            && pos[1] >= map.bounds.minY && pos[1] <= map.bounds.maxY;
    }
   
    function onPlayerMove(e) {
        if (keyFocus != Focuses.PLAYER) return;
        if ("ArrowDown" === e.key || "2" === e.key)  {
            movePlayer(0,1);
        }
        else if ("ArrowUp" === e.key || "8" === e.key) {
            movePlayer(0,-1);
        }
        else if ("ArrowLeft" === e.key || "4" === e.key) {
            movePlayer(-1,0);
        }
        else if ("ArrowRight" === e.key || "6" === e.key) {
            movePlayer(1,0);
        }
        else if ("7" === e.key) {
            movePlayer(-1,-1);
        }
        else if ("9" === e.key) {
            movePlayer( 1,-1);
        }
        else if ("1" === e.key) {
            movePlayer(-1, 1);
        }
        else if ("3" === e.key) {
            movePlayer( 1, 1);
        }
        else if ("5" === e.key) {
            movePlayer( 0, 0);
        }
        else if ('Enter' === e.key) {
            keyFocus = Focuses.DIALOG;
            var options = [
                "Player",
                "Cursor",
                "Reset map",
                "Animate move",
                "Radius 80",
                "Radius 60",
                "Radius 45",
                "Radius 30",
                "Radius 10",
                "Radius 5",
                "Radius 3",
            ];

            showDialog("Switch mode", "", options, function(optionIdx) {
                if (optionIdx == 0) {
                    keyFocus = Focuses.PLAYER;
                }
                else if (optionIdx == 1) {
                    keyFocus = Focuses.CURSOR;
                }
                else if (optionIdx == 2) {
                    initLevel();
                }
                else if (optionIdx == 3) {
                    animateMove();
                }
                else {
                    var base = 4;
                    switch(optionIdx) {
                        case base+0: radius = 80; break;
                        case base+1: radius = 60; break;
                        case base+2: radius = 45; break;
                        case base+3: radius = 30; break;
                        case base+4: radius = 10; break;
                        case base+5: radius = 5; break;
                        case base+6: radius = 3; break;
                    }
                    keyFocus = Focuses.PLAYER;
                }
                
                redraw();
            });
        }
    }

    function animateMove() {
        var moves = 80;
        var animator = setInterval(function() {
            movePlayer(1,0);
            if (--moves == 0) {
                clearInterval(animator);
                keyFocus = Focuses.PLAYER;
            }
        },10);


    }


    function movePlayer(ox, oy) {
        var newPos = [player.pos[0]+ox, player.pos[1]+oy];
        
        if (ActivateResults.ABORT === playerTurnMove(newPos)) {
            return;
        }
        nextTurn();
    }

    function activatePlayer(self, other) {
        if (other.onPlayerActivate) {
            return other.onPlayerActivate(self,other);
        }
        else {
            return activateAbort();
        }
    }

    function activateAttack(self, other) {
        if (other === player) {
            map.remove(self);
            return ActivateResults.MOVE;
        }
        else {
            return ActivateResults.STOP;
        }
    }

    function activateAbort() {
        return ActivateResults.ABORT;
    }

    function activateMove() {
        return ActivateResults.MOVE;
    }

    function randomMove(ent) {
        var offset = [randomOf([-1,0,1]), randomOf([-1,0,1])];
        var newMonsterPos = [ent.pos[0] + offset[0], ent.pos[1] + offset[1]];
        entityMove(ent, newMonsterPos);
    }

    function playerTurnMove(newPos) {
        return entityMove(player, newPos);
    }

    function entityMove(ent, newPos) {
        if (!mapInBounds(newPos)) {
            return ActivateResults.ABORT;
        }

        if (arrayEquals(ent.pos, newPos)) {
            return ActivateResults.STOP;
        }

        var destSubjects = map.getAll(newPos);
        var canMove = true;
        var canAbort = true;
        for (var subject of destSubjects) {
            if (subject.onActivate) {
                var activateResult = subject.onActivate(subject, ent);
                if (canAbort && activateResult == ActivateResults.ABORT) {
                    return ActivateResults.ABORT;
                }
                else {
                    canAbort = false;
                }
                
                if (activateResult == ActivateResults.STOP) {
                    canMove = false;
                }
                
            }
        }
        
        if (canMove) {
            map.positions.move(newPos, ent);
        }
    }

    function nextTurn() {
        var start = new Date().getTime();
        for (var each of map.objects) {
            if (each.onTurn) {
                var callback = each.onTurn;
                callback(each);
            }
        }
        redraw();
        var done = new Date().getTime();
        console.log ("turn took "+ ((done-start)/1000.0));
    }

    function monsterTurn(ent) {
        randomMove(ent);
    }

    function zombieTurn(ent) {
        var body = initProp(ent, 'body', {nextMove:3});
        if (--body.nextMove == 0) {
            body.nextMove = 3;
            randomMove(ent);
        }

        if (ent.symbol === ent.symbol.toUpperCase()) {
            ent.symbol = ent.symbol.toLowerCase();
        }
        else {
            ent.symbol = ent.symbol.toUpperCase();
        }
    }

    function zombieSpawnTurn(spawnPoint) {
        var timeout = 20;
        var body = initProp(spawnPoint, 'body', {timeout:10});

        if ( --body.timeout < 0) {
            map.put(spawnPoint.pos, EntityZombie());
            body.timeout = timeout;
        }
    }

    function monsterSpawnTurn(spawnPoint) {
        var timeout = 40;
        var body = initProp(spawnPoint, 'body', {timeout:3});

        if ( --body.timeout < 0) {
            map.put(spawnPoint.pos, EntityMonster());
            body.timeout = timeout;
        }
    }

    function redraw() {
        t.HoldFlush();
        clearConsole();
        resetInSightState();
        inSightCheck();
        drawObjects();
        t.Flush();
    }

    function resetInSightState() {
        iterateOverMap(function(x,y) {
           for (obj of map.getAll([x,y])) {
               obj.inSight = false;
           }
        });
    }

    function inSightCheck() {
        var viewCheck = viewMap.newInstance(player.pos, blocksMapSight);
        var radPoint = [radius,radius]
        var center = vecSubst(player.pos, radPoint);
        var max = [radius*2+1, radius*2+1];


        if (false) debugScan([ vecAdd(radPoint, [3,2]) ], checkCell);
        if (false) linearScan(max, checkCell);
        outboundSpiral(max, checkCell);

        function checkCell(aX,aY) {
            var pos = vecAdd([aX,aY], center);
            if (mapInBounds(pos) && viewCheck.test(pos)) {
                for (obj of map.getAll(pos)) {
                    obj.inSight = true;
                    obj.everInSight = true;
                }
            } 
        }

        function debugScan(cells, onCell) {
            for (var cell of cells) {
                onCell(cell[0],cell[1]);
            }
        }

        function linearScan(boundary, onCell) {
            for (var y=0;y<boundary[1];y++)
            for (var x=0;x<boundary[0];x++) {
                onCell(x,y);
            }   
        }

        

        function outboundSpiral(boundary, onCell) {
            var left = 0;
            var top = 0;
            var right = boundary[0]-1;
            var bottom = boundary[1]-1;

            for(;;) {
                for (var i=left;i<=right;i++) onCell(i,top);
                ++top;

                for (var i=top;i<=bottom;i++) onCell(right, i);
                --right;

                for (var i=right; i >= left; i--) onCell(i, bottom);
                --bottom;

                for (var i=bottom; i >= top; i--) onCell(left, i);
                ++left;

                if (left === right && top == bottom) {
                    onCell(left, top);
                    return;
                }
            }
        }
    }

    function buildViewMap(radius) {
        var absoluteCenter = [radius,radius];
        var sideLen = radius*2 + 1;
        
        var mesh = prep2DimArray(sideLen);
        for (var y=0;y<sideLen;y++)
        for (var x=0;x<sideLen;x++) {
            mesh[y][x] = calculateVector(absoluteCenter, [x,y]);
        }

        var mapInstance = function() {
            return {
                center: ['set by newInstance'],
                resolver: function() {return ['set by newInstance'];},
                memory: prep2DimArray(sideLen, 0),
                hits: 0,
                testCalls: 0,
                test: function(testPos) {
                    ++this.testCalls;
                    var toAbsTranslate = vecAdd(absoluteCenter, vecSubst([0,0], this.center));
                    var absolutePos = vecAdd(toAbsTranslate, testPos);
                    
                    var abX = absolutePos[0];
                    var abY = absolutePos[1];
                    
                    if (abX < 0 || abX >= sideLen || abY < 0 || abY >= sideLen) {
                        return false;
                    }

                    var snapshot = this.memory[abY][abX];
                    if (snapshot > 0) {
                        ++this.hits;
                        return snapshot;
                    }

                    var route = traceTo(mesh[abY][abX], this.center, this.resolver);
                    for (var point of route) {
                        var cachePoint = vecAdd(point, toAbsTranslate);
                        ++this.memory[cachePoint[1]][cachePoint[0]];
                    }

                    if (route.length == 0) {
                        return false;
                    }

                    var lastPoint = route[route.length-1];
                    return arrayEquals(lastPoint, testPos);

                    function traceTo(vector, startFrom, resolver) {
                        var vector = mesh[abY][abX];
                        var v = vector.v;
                        var vLen = vector.len;
    
                        var cursor = [].concat(startFrom);
                        var route = [];
                        if (vLen == 0) {
                            route.push(startFrom);
                        }

                        for (var i=0;i<vLen;i++) {
                            cursor = vecAdd(cursor, v);
                            var point = vecApply(cursor, Math.round);
                            var isBlocker = resolver(point);
                            route.push(point);
                            if (isBlocker) {
                                break;
                            }
                            
                        }

                        return route;
                    }
                }
            }
        }
        
        var ret = {
            newInstance: function(center, resolver) {
                var inst = mapInstance();
                inst.center = center;
                inst.resolver = resolver;
                return inst;
            },
            mesh:mesh
        };

        return ret;

        function calculateVector(here, target) {
            var lineStart = vecAdd(here, [0.5, 0.5]);
            var lineEnd = vecAdd(target, [0.5, 0.5]);

            var dir = vecSubst(lineEnd, lineStart);
            var vector = { 
                v:vecUnit(dir), 
                len:Math.round(vecLength(dir)) 
            }
            return vector;
        }

    }

    function prep2DimArray(side, def) {
        var ret = [];
        for (var i=0;i<side;i++) {
            var val = [];
            if (def !== undefined) {
                for (var j=0;j<side;j++) {
                    val.push(def);
                }
            }
            ret.push(val);

        }

        return ret;
    }
    
    function blocksMapSight(pos) {
        for (var each of map.getAll(pos)) {
            if (each.blocksSight) {
                return true;
            }
        }

        return false;
    }

    function vecApply2(vec1, vec2, func) {
        return [ func(vec1[0], vec2[0]), func(vec1[1], vec2[1])];
    }

    function vecApply(vec, func) {
        return [func(vec[0]), func(vec[1])];
    }

    function vecAdd(vecA, vecB) {
        return vecApply2(vecA, vecB, (a,b) => a+b);
    }

    function vecSubst(vecA, vecB) {
        return vecApply2(vecA, vecB, (a,b) => a-b);
    }
    
    function vecDivide(vecA, vecB) {
        return vecApply2(vecA, vecB, (a,b) => a/b);
    }

    function vecUnit(v) {
        var len = vecLength(v);
        return [v[0] / len, v[1]/len];
    }

    function vecLength(v) {
        return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
    }

    function pointDistance(pointA, pointB) {
        return vecLength(vecSubst(pointA, pointB));
    }

    function drawObjects() {
        iterateOverMap(function(x,y) {
            var pos = [x,y];
            var objects = map.getAll(pos);
            var toDraw = pickBest(objects);

            if (toDraw) {
                var symbolAndColor = toDraw.symbolAndColor();
                t.PutCharXY(x, y, symbolAndColor[0]);
                t.PutColorXY(x, y, [symbolAndColor[1], term.BLACK]);
            }
            else {
                t.PutCharXY(x, y, neverSeenSymbol);
                t.PutColorXY(x, y, [shadeColor, term.BLACK]);
            }
        });

        function pickBest(objects) {
            for (var each of objects) {
                var symbolAndColor = each.symbolAndColor();
                if (symbolAndColor.length > 0) {
                    return each;
                }
            }
        }

    }

    function clearConsole() {
        t.SetCursorXY(1,24);
        for (var i=0;i<24;i++) {
            t.Println("");
        }
    }

    function toAtoms(list) {
        let ret = {};
        for (let each of list) {
            ret[each]=each;
        }

        return ret;
    }

    function arrayDrop(arr, what) {
        var idx = arr.indexOf(what);
        if (idx > -1) {
            arr.splice(idx,1);
        }
    }

    function randomOf(list) {
        var idx = Math.floor(list.length * Math.random());
        return list[idx];
    }

    function arrayEquals(a,b) {
        if (a.length != b.length) {
            return false;
        }

        for (var i=0;i<a.length;i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }

        return true;
    }

    function initProp(obj, name, value) {
        if (!obj[name]) {
            obj[name] = value;
            return value;
        }
        else {
            return obj[name];
        }
    }

    function showDialog(title, message, options, onOption, escapeOption=-1) {
        window.addEventListener('keydown', onDialogPress);

        var color = [term.LIGHTGRAY,term.BLACK];
        var selectedColor = [term.BLACK, term.LIGHTGRAY];

        var selectedOption = 0;
        var messageLines = message.split('\n');
        if (message) {
            messageLines.push(''); // extra line to separate options
        }   
        var messageRect = textRectFromLines(messageLines);
        var optionsRect = textRectFromLines(options);

        var boxWidth = Math.max(title.length,messageRect[0], optionsRect[0])
            
        var box = vecAdd( 
            [4,3], 
            [ boxWidth, messageRect[1] + optionsRect[1] ]
        );

        var offset = vecApply(vecDivide(vecSubst([80,24], box), [2,2]), Math.floor);
        var paddedOptions = textPadWithSpaces(options, boxWidth);

        t.HoldFlush();
        drawDialog();
        t.Flush();

        function drawDialog() {
            
            var cursor = vecAdd(offset,[2,1]);
            t.DrawBox(offset[0],offset[1],box[0],box[1],TermBorder(' '), color, title);

            printLineWithCursorAndColor(messageLines, -1);
            printLineWithCursorAndColor(paddedOptions, selectedOption);

            function printLineWithCursorAndColor(lines, selectIdx) {
                for (var i=0;i<lines.length;i++) {
                    var line = lines[i];
                    t.SetCursorXY(cursor[0], cursor[1]);
                    t.Print(line, selectIdx == i ? selectedColor : color);
    
                    ++cursor[1];
                }
            }
        }

        function onDialogPress(e) {
            if ('Escape' === e.key && escapeOption > -1) {
                selectedOption = escapeOption;
                closeDialog();
            }
            else if ('ArrowUp' === e.key) {
                selectedOption = rangedOption(selectedOption-1, options.length);
                drawDialog();
            }
            else if ('ArrowDown' === e.key) {
                selectedOption = rangedOption(selectedOption+1, options.length);
                drawDialog();
            }
            else if ('Enter' === e.key) {
                closeDialog();
            }
        }

        function closeDialog() {
            window.removeEventListener('keydown', onDialogPress);
            onOption(selectedOption);
        }
    } 

    function rangedOption(val, range) {
        return (val + range) % range;
    }

    function textPadWithSpaces(lines, padSize) {
        var ret = [];
        for (var line of lines) {
            ret.push( [line, nChr(' ', padSize-line.length)].join(''));
        }

        return ret;
    }

    function nChr(chr, times) {
        var ret = [];
        for (var i=0;i<times;i++) {
            ret.push(chr);
        }

        return ret.join('');
    }

    function textRectFromLines(lines) {
        var maxWidth = 0;
        for (var line of lines) {
            maxWidth = Math.max(maxWidth, line.length);
        }

        return [maxWidth, lines.length];
    }

}

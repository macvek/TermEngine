window.addEventListener('load', dungeon);

function dungeon() {
    var t = TermStart();
    var Focuses = toAtoms(['PLAYER'])
    var ActivateResults = toAtoms(['MOVE','ABORT','STOP']);

    let keyFocus = Focuses.PLAYER;
    var map = initMap();

    window.addEventListener('keydown', onPlayerMove);
    var player = EntityPlayer();

    var radius = 40;
    var viewMap = buildViewMap(radius);

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

    inLevelWalk();

    function inLevelWalk() {
        t.HideCursor();
        clearConsole();
        redraw();
    }

    function drawOnMap(lines) {
        for (var y=0;y<lines.length;y++) 
        for (var x=0;x<lines[y].length;x++) {
            var chr = lines[y].charAt(x);
            var pos = [x+1,y+1];
            var ent = null;
            if ("#" === chr) {
                ent = EntityWall();
            }
            else if ("@" === chr) {
                ent = player;
            }
            else if ("S" === chr) {
                ent = EntityZombieSpawn();
            }
            else if ("B" === chr) {
                ent = EntityMonsterSpawn();
            }

            if (ent) {
                map.put(pos, ent);
            }
        }
    }

    function EntityPlayer() {
        return dynamicObject('@','Player', activatePlayer);
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

        return wall;
    }
    
    function EntityZombieSpawn() {
        return dynamicObject(null, 'ZombieSpawn', activateMove, zombieSpawnTurn);
    }

    function EntityMonsterSpawn() {
        return dynamicObject(null, 'MonsterSpawn', activateMove, monsterSpawnTurn);
    }

    function dynamicObject(symbol, name, onActivate, onTurn) {
        return {
            pos: [-1,-1],
            symbol:symbol,
            name: name,
            onActivate: onActivate,
            onTurn: onTurn,
            blocksSight: false,
        }
    }

    function initMap() {
       
        return {
            bounds:{ minX:1, maxX:80, minY:1, maxY:24 },
            objects: [],
            positions: indexedObjects(),
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

    function indexedObjects() {
        return {
            rows: [],
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
        var destination = map.positions.get(newPos);
        var destSubjects = [].concat(destination);
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
        for (var each of map.objects) {
            if (each.onTurn) {
                var callback = each.onTurn;
                callback(each);
            }
        }
        redraw();
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
        //clearConsole();
        //drawObjects();
        //drawLineOfSight();
        drawMesh(20);
        t.Flush();
    }

    function drawMesh(rad) {
        var viewMap = buildViewMap(rad);
        var mesh = viewMap.mesh;
        var queue = [];
        var sideLength = mesh.length;
        for (var i=0;i<sideLength;i++) { if (mapInBounds([i+1,1])) {queue.push([i,0]);} }
        for (var i=0;i<sideLength;i++) { if (mapInBounds([sideLength,i+1])) {queue.push([sideLength-1,i]);} }
        for (var i=sideLength-1;i>0;i--) { if (mapInBounds([i+1,sideLength])) {queue.push([i,sideLength-1]);} }
        for (var i=sideLength-1;i>0;i--) { if (mapInBounds([1,i+1])) {queue.push([0,i]);} }
        
        

        function drawMeshValues() {
            for (var y=0;y<mesh.length;y++) {
                var row = mesh[y];
                for (var x=0;x<row.length;x++) {
                    var routes = mesh[y][x];
                    if (mapInBounds([x+1,y+1])) {
                        t.PutCharXY(x+1,y+1, ''+routes.length);
                    }
                }
            }
        }

        var colors = [term.BLUE,term.RED];
        var idx = 0;

        drawMeshValues();
        setInterval(function() {
            t.HoldFlush();
            clearConsole();
            drawMeshValues();
            drawRoute(mesh, queue[idx++ % queue.length], colors[idx % colors.length]);
            t.Flush();
        },500);
        
    }

    function drawRoute(mesh, pos,color) {
        var x = pos[0];
        var y = pos[1];
        var route = mesh[y][x];
        t.PutColorXY(x+1, y+1, [color, term.BLACK]);

        for (var points of route) {
            for (var point of points) {
                drawRoute(mesh, [x+point[0], y+point[1]], color);
            }
            
        }
       
    }


    function drawLineOfSight() {
        var viewCheck = viewMap.newInstance(player.pos, blocksMapSight);
        for (var y=player.pos[1]-radius;y<=player.pos[1]+radius;y++)
        for (var x=player.pos[0]-radius;x<=player.pos[0]+radius;x++) {
            
            if (mapInBounds([x,y]) && viewCheck.test([x,y])) {
                if (t.GetCharXY(x,y) === ' ') {
                    t.PutCharXY(x,y, specialChars.DOT);
                }
                var color = t.GetColorXY(x,y)
                t.PutColorXY(x,y, [color[0], term.RED]);
            } 
        }
    }

    function buildViewMap(radius) {
        var absoluteCenter = [radius,radius];
        var sideLen = radius*2 + 1;
        
        var mesh = prep2DimArray(sideLen);
        for (var y=0;y<sideLen;y++)
        for (var x=0;x<sideLen;x++) {
            mesh[y][x] = pickNeighbours([x,y], absoluteCenter);
        }

        var mapInstance = function() {
            var memory = prep2DimArray(sideLen);
            memory[radius][radius] = true; // center is always visible; terminator for recursion;
            
            return {
                center: ['set by newInstance'],
                resolver: function() {return ['set by newInstance'];},
                memory: memory,
                test: function(testPos) {
                    var absolutePos = vecAdd(absoluteCenter, vecDiff(testPos, this.center));
                    
                    var abX = absolutePos[0];
                    var abY = absolutePos[1];
                    
                    if (abX < 0 || abX >= sideLen || abY < 0 || abY >= sideLen) {
                        return false;
                    }

                    var snapshot = this.memory[ abY ][ abX ];
                    if (typeof snapshot === 'boolean') {
                        return snapshot;
                    }

                    var routes = mesh[abY][abX];
                    var success = false;
                    for (var route of routes) {
                        // hitting last step of the route, should never happen, as center is automatically cached in memory
                        if (route.length == 0) {
                            success = true;
                            break;
                        }

                        var skipRoute = false;
                        for (var point of route) {
                            var neighbour = vecAdd(point, testPos);
                            var isBlocker = this.resolver( neighbour );
                            if (isBlocker) {
                                skipRoute = true;
                                break;
                            }
                        }

                        if (skipRoute) {
                            continue;
                        }

                        var lastPoint = route[route.length-1];
                        var canSee = this.test(lastPoint);
                        if (canSee) {
                            success = true;
                            break;
                        }
                    }

                    var ret = success;
                    this.memory[ abY ][ abX ] = ret;
                    return ret;
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

        function pickNeighbours(here, target) {
            if (here[0] === target[0]) {
                if (here[1] < target[1]) {
                    return [ [[0,1]] ];
                }
                else if (here[1] > target[1]) {
                    return [ [[0,-1]] ];
                }
                else {
                    return [];
                }
            }

            var neighbours = closerNeighbours(here, target);
            
            var lineStart = vecAdd(here, [0.5, 0.5]);
            var lineEnd = vecAdd(target, [0.5, 0.5]);

            var line = buildLine(lineStart, lineEnd);

            return lineHitTestList(line, here, neighbours);
        }

    }

    function closerNeighbours(here, target) {
        var neighbours = [];
        for (var y=-1;y<=1;y++)
        for (var x=-1;x<=1;x++) {
            if ( !(x == 0 && y == 0) ) {
                neighbours.push([x,y]);
            }
        }

        var hereDist = pointDistance(here, target);
        var closer = [];
        for (var each of neighbours) {
            var eachDist = pointDistance(vecAdd(here, each), target);
            if (eachDist < hereDist) {
                closer.push(each);
            }
        }

        return closer;
    }

    function lineHitTestList(line, baseBox, offsetBoxes) {
        var ret = [];
        for (var box of offsetBoxes) {
            if (lineHitTest(line, vecAdd(baseBox, box))) {
                ret.push([box]);
            }
        }

        return ret;
    }

    function lineHitTest(line, box) {
        if (line.a == 0) {
            return line.b > box[1] && line.b < box[1]+1;
        }
        else {
            var perpLine = linePerpendicularWithPoint(line, vecAdd([0.5, 0.5], box));
            var cX = (perpLine.b - line.b) / (line.a - perpLine.a);
            var cY = line.a * cX + line.b;

            return cX > box[0] && cX < box[0]+1 && cY > box[1] && cY < box[1]+1;
        }
    }

    function linePerpendicularWithPoint(line, point) {
        var newA = -1/line.a;
        return {
            a: newA,
            b: point[1] - newA * point[0]
        }
    }

    function buildLine(start, end) {
        var a = ( end[1] - start[1]) / ( end[0] - start[0]);
        var b = start[1] - a*start[0];
        return {a:a, b:b};
    }

    function prep2DimArray(side) {
        var ret = [];
        for (var i=0;i<side;i++) {
            ret.push([]);
        }

        return ret;
    }
    
    function blocksMapSight(pos) {
        for (var each of map.positions.get(pos)) {
            if (each.blocksSight) {
                return true;
            }
        }
        return false;
    }

    function vecAdd(vecA, vecB) {
        return [vecA[0] + vecB[0], vecA[1] + vecB[1]];
    }

    function vecDiff(vecA, vecB) {
        return [vecA[0] - vecB[0], vecA[1] - vecB[1]];
    }

    function vecLength(v) {
        return Math.sqrt(v[0]*v[0]+v[1]*v[1]);
    }

    function pointDistance(pointA, pointB) {
        return vecLength(vecDiff(pointA, pointB));
    }

    function drawObjects() {
        for (var each of map.objects) {
            if (each.symbol) {
                t.PutCharXY(each.pos[0], each.pos[1], each.symbol);
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

    function randomRange(from, to) {
        return from + Math.floor((to-from) * Math.random());
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

}

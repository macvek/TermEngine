window.addEventListener('load', dungeon);

function dungeon() {
    var t = TermStart();
    var Focuses = toAtoms(['PLAYER'])
    var ActivateResults = toAtoms(['MOVE','ABORT','STOP']);

    let keyFocus = Focuses.PLAYER;
    var map = initMap();

    window.addEventListener('keydown', onPlayerMove);
    var player = EntityPlayer();

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
        "                                                       #########################",
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
        return dynamicObject('#', 'Wall', activateAbort);
    }
    
    function EntityZombieSpawn() {
        return dynamicObject(null, 'ZombieSpawn', activateMove, zombieSpawnTurn);
    }

    function dynamicObject(symbol, name, onActivate, onTurn) {
        return {
            pos: [-1,-1],
            symbol:symbol,
            name: name,
            onActivate: onActivate,
            onTurn: onTurn
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

    function redraw() {
        t.HoldFlush();
        clearConsole();
        drawObjects();
        t.Flush();
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

window.addEventListener('load', dungeon);

function dungeon() {
    var t = TermStart();
    var Focuses = toAtoms(['PLAYER'])

    let keyFocus = Focuses.PLAYER;
    var map = initMap();

    window.addEventListener('keydown', onPlayerMove);
    var player = dynamicObject('@','Player');

    map.put([1,1], player);
    map.put([3,3], dynamicObject('Y','Monster'));
    
    inLevelWalk();
    window.debugMap = map;

    function inLevelWalk() {
        t.HideCursor();
        clearConsole();
        redraw();
    }

    function dynamicObject(symbol, name) {
        return {
            pos: [-1,-1],
            symbol:symbol,
            name: name
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
        if ("ArrowDown" === e.key) {
            movePlayer(0,1);
        }
        else if ("ArrowUp" === e.key) {
            movePlayer(0,-1);
        }
        else if ("ArrowLeft" === e.key) {
            movePlayer(-1,0);
        }
        else if ("ArrowRight" === e.key) {
            movePlayer(1,0);
        }

    }

    function movePlayer(ox, oy) {
        var newPos = [player.pos[0]+ox, player.pos[1]+oy];
        if (mapInBounds(newPos)) {
            playerTurnMove(newPos);
            nextTurn();
        }
    }

    function playerTurnMove(newPos) {
        var destination = map.positions.get(newPos);
        var victims = [].concat(destination);
        for (var each of victims) {
            map.positions.remove(each);
            arrayDrop(map.objects, each);
        }
        
        map.positions.move(newPos, player);
    }

    function nextTurn() {
        for (var each of map.objects) {
            if (each !== player) {
                monsterTurnMove(each);
            }
        }
        spawnRandomMonster();
        redraw();
    }

    function monsterTurnMove(monster) {
        var offset = [randomOf([-1,0,1]), randomOf([-1,0,1])];
        var newMonsterPos = [monster.pos[0] + offset[0], monster.pos[1] + offset[1]];
        if (mapInBounds(newMonsterPos)) {
            map.positions.move(newMonsterPos, monster);
        }
    }

    function spawnRandomMonster() {
        if (0.1 > Math.random()) {
            var nextMonster = dynamicObject(randomOf(['Y','Z','A']), 'Monster');
            map.put([randomRange(5,75), randomRange(5,20)], nextMonster);
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
            t.PutCharXY(each.pos[0], each.pos[1], each.symbol);
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

}

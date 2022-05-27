window.addEventListener('load', dungeon);

function dungeon() {
    var t = TermStart();
    var Focuses = toAtoms(['PLAYER'])

    let keyFocus = Focuses.PLAYER;
    var map = initMap();

    window.addEventListener('keydown', onPlayerMove);
    var player = dynamicObject('Player');
    var monster = dynamicObject('Monster');
    map.positions.put([1,1], player);
    map.positions.put([3,3], monster);
    inLevelWalk();
    window.debugMap = map;

    function inLevelWalk() {
        t.HideCursor();
        clearConsole();
        redraw();
    }

    function dynamicObject(name) {
        return {
            pos: [-1,-1],
            name: name
        }
    }

    function initMap() {
       
        return {
            bounds:{ minX:1, maxX:80, minY:1, maxY:24 },
            objects: [],
            positions: indexedObjects()
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
                var previousList = this.get(what.pos);
                arrayDrop(previousList, what);
                this.put(pos, what);
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

    function gameTurnMove(newPos) {
        if (mapInBounds(newPos)) {
            map.positions.move(newPos, player);
        }

        var offset = [randomOf([-1,0,1]), randomOf([-1,0,1])];
        var newMonsterPos = [monster.pos[0] + offset[0], monster.pos[1] + offset[1]];

        if (mapInBounds(newMonsterPos)) {
            map.positions.move(newMonsterPos, monster);
        }

        redraw();
    }
   
    function redraw() {
        t.HoldFlush();
        clearConsole();
        drawObjects();
        t.Flush();
    }

    function movePlayer(ox, oy) {
        gameTurnMove([player.pos[0]+ox, player.pos[1]+oy]);
    }

    function drawObjects() {
        t.PutCharXY(player.pos[0], player.pos[1], '@');
        t.PutCharXY(monster.pos[0], monster.pos[1], 'Y');
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

}

function debugScan(cells, onCell) {
    for (var cell of cells) {
        onCell(cell[0], cell[1]);
    }
}

function fillWithLineBreaks(lines, trimWidth) {
    if (trimWidth < 2) {
        console.error("Incorrect trimWidth");
        return [];
    }
    var ret = [];
    for (var line of lines) {
        var eachLine = line;
        while (eachLine.length > trimWidth) {
            ret.push(eachLine.substring(0, trimWidth - 1) + specialChars.LINEBREAK);
            eachLine = eachLine.substring(trimWidth - 1, line.length);
        }

        ret.push(eachLine);

    }
    return ret;
}

function printScrollSummary(maxWidth, idx, maxIdx) {
    var posPercent = Math.round(100 * idx / maxIdx);

    var arrows = [
        posPercent < 100 ? specialChars.ARROWDOWN : ' ',
        posPercent > 0 ? specialChars.ARROWUP : ' '
    ].join("");

    t.Print("UD XXX%".length > maxWidth ? arrows : arrows + " " + posPercent + "%");

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

function rangedOption(val, range) {
    return (val + range) % range;
}

function textPadWithSpaces(lines, padSize) {
    var ret = [];
    for (var line of lines) {
        ret.push( padWith(line, padSize, ' ', false));
    }

    return ret;
}

function padWith(text, padSize, chr, left=true) {
    if (padSize < text.length) {
        if (left) {
            return text.substring(text.length-padSize, text.length);
        }
        else {
            return text.substring(0, padSize);
        }
    }

    var padPart = nChr(chr, padSize - text.length);
    return left ? padPart + text : text + padPart;
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

function applyAll(listToApply, args) {
    for (var callback of listToApply) {
        callback.apply(null, args);
    }
}

function outboundSpiralScan(boundary, onCell) {
    var ringParams = {
        top:0,
        left:0,
        right: boundary[0]-1,
        bottom:boundary[1]-1
    }

    for(;;) {
        ringParams = ringScan(ringParams, onCell);
        if (ringParams.left === ringParams.right && ringParams.top == ringParams.bottom) {
            onCell(ringParams.left, ringParams.top);
            return;
        }
    }
}

function ringScanCenterRadius(center, radius, onCell) {
    return ringScan({
        top: center[1]-radius-1,
        left: center[0]-radius-1,
        right: center[0]+radius+1,
        bottom: center[1]+radius+1
    }, onCell);
}

function ringScan(ringParams, onCell) {
    var left = ringParams.left;
    var top = ringParams.top;
    var right = ringParams.right;
    var bottom = ringParams.bottom;

    for (var i=left;i<=right;i++) onCell(i,top);
    ++top;

    for (var i=top;i<=bottom;i++) onCell(right, i);
    --right;

    for (var i=right; i >= left; i--) onCell(i, bottom);
    --bottom;

    for (var i=bottom; i >= top; i--) onCell(left, i);
    ++left;

    return {
        top:top,
        left:left,
        right:right,
        bottom:bottom
    }

}

function linearScan(boundary, onCell) {
    for (var y=0;y<boundary[1];y++)
    for (var x=0;x<boundary[0];x++) {
        onCell(x,y);
    }   
}

function offsetToCenterBoxOnScreen(box) {
    return vecApply(vecDivide(vecSubst([80,24], box), [2,2]), Math.floor);
}

function traceTo(vector, startFrom, resolver) {
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

function randomOf(list) {
    var idx = Math.floor(list.length * Math.random());
    return list[idx];
}

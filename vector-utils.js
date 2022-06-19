function vecApply2(vec1, vec2, func) {
    return [func(vec1[0], vec2[0]), func(vec1[1], vec2[1])];
}

function vecApply(vec, func) {
    return [func(vec[0]), func(vec[1])];
}

function vecAdd(vecA, vecB) {
    return vecApply2(vecA, vecB, (a, b) => a + b);
}

function vecSubst(vecA, vecB) {
    return vecApply2(vecA, vecB, (a, b) => a - b);
}

function vecDivide(vecA, vecB) {
    return vecApply2(vecA, vecB, (a, b) => a / b);
}

function vecUnit(v) {
    var len = vecLength(v);
    return [v[0] / len, v[1] / len];
}

function vecLength(v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

function pointDistance(pointA, pointB) {
    return vecLength(vecSubst(pointA, pointB));
}

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

function posListToBitmap(posList) {
    var ret = [];
    for (var pos of posList) {
        if (!ret[pos[1]]) {
            ret[pos[1]] = [];
        }

        ret[pos[1]][pos[0]] = 1;
    }

    return {
        bitmap: ret,
        test: function(pos) {
            return this.bitmap[pos[1]] && this.bitmap[pos[1]][pos[0]];
        }
    };
}


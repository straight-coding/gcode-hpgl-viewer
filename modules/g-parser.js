/*
  g-parser.js
  Author: Straight Coder<simpleisrobust@gmail.com>
  Date: April 13, 2023
*/

'use strict';

class GParser {
    #scale;
    #obsolute;
    constructor(lines) {
        this.#scale = {x:1,y:1,z:1};
        this.#obsolute = true;

        this.inited = false;
        //Object.assign(this, opt);

        this.init();
    }
    init() {
        const _this = this;
        this.inited = true;
    }
    valid(obj) {
        return ((obj != undefined) && (obj != null));
    }
    parse(data) {
        this.lastPos = {x:null,y:null,z:null,i:null,j:null,k:null};
        this.prevG = 0;
        this.lastG = null;
        this.lastM = null;
        this.lastPlane = 17;
        this.min = {
            x: Number.MAX_VALUE,
            y: Number.MAX_VALUE,
            z: Number.MAX_VALUE
        };
        this.max = {
            x: Number.MIN_VALUE,
            y: Number.MIN_VALUE,
            z: Number.MIN_VALUE
        };

        let figure = null;
        let figures = [];

        if (!this.#obsolute) {
            this.lastPos = {x:0,y:0,z:0,i:0,j:0,k:0};
        }

        let EoP = false;
        let nNesting = 0;

        let line = '';
        let n = 0;
        let linePos = 0;
        let lastG0Pos = 0;
        let CRs = [];
        for(let i = 0; i < data.length; i ++) {
            let idxCR = -1;
            if ((data[i] == '\r') || (data[i] == '\n')) {
                //line break
                idxCR = CRs.indexOf(data[i]);
                if (idxCR < 0) {
                    CRs.push(data[i]);
                    idxCR = CRs.indexOf(data[i]);
                }
            }
            else {
                //line content
                if (!line) {
                    linePos = i;
                }
                line += data[i];
            }

            if ((idxCR < 0) && (i != data.length-1)) {
                //line content
                continue;
            }

            if ((n %1000) == 0) {
                //console.log('line #' + n);
            }

            line = line.toUpperCase();
            if (!line) {
                if (idxCR == 0) {
                    n++;
                }
                continue;
            }

            let cmd = '';
            let value = '';
            let blocks = [];
            let nextPoint = {
                x: this.lastPos.x,
                y: this.lastPos.y,
                z: this.lastPos.z,
                i: this.lastPos.i,
                j: this.lastPos.j,
                k: this.lastPos.k
            };

            for(let c = 0; c < line.length; c ++) {
                if (line[c] == '(') { //comment begins
                    nNesting ++;
                    continue;
                }
                if (nNesting > 0) {
                    if (line[c] == ')') { //comment ends
                        if (nNesting > 0)
                            nNesting --;
                    }
                    continue; //skip comments
                }
                if (line[c] == ' ') {
                    continue;
                }
                if (line[c] == '\t') {
                    continue;
                }

                if ((line[c] >= 'A') && (line[c] <= 'Z')) {
                    if ((cmd.length > 0) && (value.length > 0)) {
                        blocks.push([cmd,value]);
                        cmd = '';
                        value = '';
                    }
                    cmd += line[c];
                }
                else if (line[c] == '+'){
                    value += line[c];
                }
                else if (line[c] == '-'){
                    value += line[c];
                }
                else if (line[c] == '.'){
                    value += line[c];
                }
                else if ((line[c] >= '0') && (line[c] <= '9')) {
                    value += line[c];
                }
                else if (line[c] == ';'){
                    break;
                }
                else {
                    break;
                }
            }
            if ((cmd.length > 0) && (value.length > 0)) {
                blocks.push([cmd, value]);
            }

            let R = null;
            let moving = false;
            for(let b = 0; b < blocks.length; b ++) {
                let block = blocks[b];
                if (block[0] == 'T') {
                }
                else if (block[0] == 'F') {
                }
                else if (block[0] == 'M') {
                    let mCode = parseInt(block[1], 10);
                    if ((mCode == 2) || (mCode == 30)) {
                        EoP = true;
                    }
                    this.lastM = mCode;
                }
                else if (block[0] == 'G') {
                    let gCode = parseInt(block[1], 10);
                    if (gCode == 90) {
                        this.#obsolute = true;
                    }
                    else if (gCode == 91) {
                        this.#obsolute = false;
                    }
                    else if (gCode == 20) {
                        this.#scale = {x:25.4,y:25.4,z:25.4};
                    }
                    else if (gCode == 21) {
                        this.#scale = {x:1.0,y:1.0,z:1.0};
                    }
                    else if ((gCode == 17) || (gCode == 18) || (gCode == 19)) { //XY, ZX, YZ
                        if (figure != null) {
                            figures.push(figure);
                        }
                        figure = new Figure();
                        figure.append(gCode, (n+1), linePos);
                        figures.push(figure);
                        figure = null;
        
                        this.lastPlane = gCode;
                    }
                    else if (gCode <= 3) {
                        this.lastG = gCode;
                    }
                }
                else if ((block[0] == 'R')) {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        R = this.#scale.x*parseFloat(block[1], 10);
                    }
                }
                else if ((block[0] == 'X')) {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        if (this.#obsolute) {
                            nextPoint.x = this.#scale.x*parseFloat(block[1], 10);
                        }
                        else {
                            nextPoint.x += this.#scale.x*parseFloat(block[1], 10);
                        }
                        if (this.min.x > nextPoint.x)    this.min.x = nextPoint.x;
                        if (this.max.x < nextPoint.x)    this.max.x = nextPoint.x;
                    }
                }
                else if (block[0] == 'Y') {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        if (this.#obsolute) {
                            nextPoint.y = this.#scale.y*parseFloat(block[1], 10);
                        }
                        else {
                            nextPoint.y += this.#scale.y*parseFloat(block[1], 10);
                        }
                        if (this.min.y > nextPoint.y)    this.min.y = nextPoint.y;
                        if (this.max.y < nextPoint.y)    this.max.y = nextPoint.y;
                    }
                }
                else if (block[0] == 'Z') {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        if (this.#obsolute) {
                            nextPoint.z = this.#scale.z*parseFloat(block[1], 10);
                        }
                        else {
                            nextPoint.z += this.#scale.z*parseFloat(block[1], 10);
                        }
                        if (this.min.z > nextPoint.z)    this.min.z = nextPoint.z;
                        if (this.max.z < nextPoint.z)    this.max.z = nextPoint.z;
                    }
                }
                else if (block[0] == 'I') {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        nextPoint.i = this.#scale.x*parseFloat(block[1], 10);
                    }
                }
                else if (block[0] == 'J') {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        nextPoint.j = this.#scale.y*parseFloat(block[1], 10);
                    }
                }
                else if (block[0] == 'K') {
                    if (this.valid(this.lastG)) {
                        moving = true;
                        nextPoint.k = this.#scale.z*parseFloat(block[1], 10);
                    }
                }
            }

            if (this.valid(R)) {
                let center = this.getCenter(this.lastPlane, this.lastG, [this.lastPos.x, this.lastPos.y, this.lastPos.z], [nextPoint.x, nextPoint.y, nextPoint.z], R);
                nextPoint.i = center[0] - this.lastPos.x;
                nextPoint.j = center[1] - this.lastPos.y;
                nextPoint.k = center[2] - this.lastPos.z;
            }

            if (moving && (this.lastG <= 3)) {
                if (this.lastG == 0) {
                    lastG0Pos = linePos;
                    if (figure != null) {
                        figures.push(figure);
                        figure = null;
                    }
                }
                else {
                    if (this.prevG == 0) {
                        if (figure == null) {
                            figure = new Figure();
                        }
                        figure.append(this.prevG, (n+1), lastG0Pos, this.lastPos.x, this.lastPos.y, this.lastPos.z);
                    }

                    if (this.lastG == 1) {
                        if ((nextPoint.x != null) && (nextPoint.y != null) && (nextPoint.z != null)) {
                            if (figure == null) {
                                figure = new Figure();
                            }
                            figure.append(this.lastG, (n+1), lastG0Pos, nextPoint.x, nextPoint.y, nextPoint.z);
                        }
                    }
                    else if (this.lastG <= 3) {
                        if (figure == null) {
                            figure = new Figure();
                        }
                        figure.append(this.lastG, (n+1), lastG0Pos, nextPoint.x, nextPoint.y, nextPoint.z, nextPoint.i, nextPoint.j, nextPoint.k);
                    }
                }
            }
            if (moving) {
                this.lastPos.x = nextPoint.x;
                this.lastPos.y = nextPoint.y;
                this.lastPos.z = nextPoint.z;
                this.lastPos.i = nextPoint.i;
                this.lastPos.j = nextPoint.j;
                this.lastPos.k = nextPoint.k;
            }

            line = '';
            if (idxCR == 0) {
                n++;
            }

            if (EoP) {
                break;
            }
            this.prevG = this.lastG;
        }
        if (figure != null) {
            figures.push(figure);
        }
        figure = new Figure();
        figure.append(-1, -1, -1, this.min.x, this.min.y, this.min.z, this.max.x, this.max.y, this.max.z);
        figures.unshift(figure);

        return figures;
    }
    getCenter(plane, mType, from, to, r) {
        let center = null;
        if (plane == 17) {
            let coord = Math.sqrt((from[0]-to[0])*(from[0]-to[0]) + (from[1]-to[1])*(from[1]-to[1]) + (from[2]-to[2])*(from[2]-to[2]));
            let dir = Math.atan2(to[1]-from[1], to[0]-from[0]);
            let angle = Math.acos(coord/(2*Math.abs(r)));
            let ang2Center;
            if (mType == 2) {
                ang2Center = dir + (r>0 ? -1 : +1) * angle;
            }
            else {
                ang2Center = dir + (r>0 ? +1 : -1) * angle;
            }
            center = [
                from[0] + Math.abs(r) * Math.cos(ang2Center),
                from[1] + Math.abs(r) * Math.sin(ang2Center),
                from[2]
            ];
        }
        return center;
    }

}

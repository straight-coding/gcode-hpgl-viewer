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
        this.lastG = null;
        this.lastM = null;
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

            line = line.toUpperCase();
            let cmd = '';
            let value = '';
            let blocks = {};

            let plane = null;
            let gCode = null;
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
                else if (nNesting > 0) {
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
                        blocks[cmd] = value;
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
                blocks[cmd] = value;
            }
            if ('G' in blocks) {
                gCode = parseInt(blocks['G'], 10);
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
                else if (gCode == 17) {
                    plane = gCode;
                }
                else if (gCode == 18) {
                    plane = gCode;
                }
                else if (gCode == 19) {
                    plane = gCode;
                }
            }
            if ('M' in blocks) {
                let mCode = parseInt(blocks['M'], 10);
                if ((mCode == 2) || (mCode == 30)) {
                    EoP = true;
                }
                this.lastM = mCode;
            }
            
            let moving = false;
            if (gCode <= 3) {
                if ('X' in blocks) {
                    moving = true;
                    if (this.#obsolute) {
                        nextPoint.x = this.#scale.x*parseFloat(blocks['X'], 10);
                    }
                    else {
                        nextPoint.x += this.#scale.x*parseFloat(blocks['X'], 10);
                    }
                    if (this.min.x > nextPoint.x)    this.min.x = nextPoint.x;
                    if (this.max.x < nextPoint.x)    this.max.x = nextPoint.x;
                }
                if ('Y' in blocks) {
                    moving = true;
                    if (this.#obsolute) {
                        nextPoint.y = this.#scale.y*parseFloat(blocks['Y'], 10);
                    }
                    else {
                        nextPoint.y += this.#scale.y*parseFloat(blocks['Y'], 10);
                    }
                    if (this.min.y > nextPoint.y)    this.min.y = nextPoint.y;
                    if (this.max.y < nextPoint.y)    this.max.y = nextPoint.y;
                }
                if ('Z' in blocks) {
                    moving = true;
                    if (this.#obsolute) {
                        nextPoint.z = this.#scale.z*parseFloat(blocks['Z'], 10);
                    }
                    else {
                        nextPoint.z += this.#scale.z*parseFloat(blocks['Z'], 10);
                    }
                    if (this.min.z > nextPoint.z)    this.min.z = nextPoint.z;
                    if (this.max.z < nextPoint.z)    this.max.z = nextPoint.z;
                }
                if ('I' in blocks) {
                    moving = true;
                    nextPoint.i = this.#scale.x*parseFloat(blocks['I'], 10);
                }
                if ('J' in blocks) {
                    moving = true;
                    nextPoint.j = this.#scale.y*parseFloat(blocks['J'], 10);
                }
                if ('K' in blocks) {
                    moving = true;
                    nextPoint.k = this.#scale.z*parseFloat(blocks['K'], 10);
                }
            }

            if (plane) {
                if (figure != null) {
                    figures.push(figure);
                }
                figure = new Figure();
                figure.append(plane, (n+1), linePos);
                figures.push(figure);
                figure = null;
            }

            if (this.valid(gCode) && (gCode <= 3) && moving) {
                if (gCode == 0) {
                    lastG0Pos = linePos;
                    if (figure != null) {
                        figures.push(figure);
                        figure = null;
                    }
                }
                else {
                    if (this.lastG == 0) {
                        if (figure == null) {
                            figure = new Figure();
                        }
                        figure.append(0, (n+1), lastG0Pos, this.lastPos.x, this.lastPos.y, this.lastPos.z);
                    }

                    if (gCode == 1) {
                        if ((nextPoint.x != null) && (nextPoint.y != null) && (nextPoint.z != null)) {
                            if (figure == null) {
                                figure = new Figure();
                            }
                            figure.append(gCode, (n+1), lastG0Pos, nextPoint.x, nextPoint.y, nextPoint.z);
                        }
                    }
                    else if (gCode <= 3) {
                        if (figure == null) {
                            figure = new Figure();
                        }
                        figure.append(gCode, (n+1), lastG0Pos, nextPoint.x, nextPoint.y, nextPoint.z, nextPoint.i, nextPoint.j, nextPoint.k);
                    }
                }
            }
            if ((gCode != null) && (gCode <= 3)) {
                this.lastG = gCode;

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
        }
        if (figure != null) {
            figures.push(figure);
        }
        figure = new Figure();
        figure.append(-1, -1, -1, this.min.x, this.min.y, this.min.z, this.max.x, this.max.y, this.max.z);
        figures.unshift(figure);

        return figures;
    }
}

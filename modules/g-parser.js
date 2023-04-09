
class GParser {
    #lastPoint;
    #scale;
    #obsolute;
    #lastCmd;
    #indexBlock;
    #pathIndex;
    constructor(lines) {
        this.#lastCmd = -1;
        this.#lastPoint = {x:null,y:null,z:null};
        this.#scale = {x:1,y:1,z:1};
        this.#obsolute = true;

        this.#indexBlock = 50;
        this.#pathIndex = {};
        
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
                let gCode = parseInt(blocks['G'], 10);
                if (gCode <= 3) {
                    this.lastG = gCode;
                }
                else if (gCode == 90) {
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
            if ('X' in blocks) {
                moving = true;
                if (this.#obsolute) {
                    this.lastPos.x = this.#scale.x*parseFloat(blocks['X'], 10);
                }
                else {
                    this.lastPos.x += this.#scale.x*parseFloat(blocks['X'], 10);
                }
                if (this.min.x > this.lastPos.x)    this.min.x = this.lastPos.x;
                if (this.max.x < this.lastPos.x)    this.max.x = this.lastPos.x;
            }
            if ('Y' in blocks) {
                moving = true;
                if (this.#obsolute) {
                    this.lastPos.y = this.#scale.y*parseFloat(blocks['Y'], 10);
                }
                else {
                    this.lastPos.y += this.#scale.y*parseFloat(blocks['Y'], 10);
                }
                if (this.min.y > this.lastPos.y)    this.min.y = this.lastPos.y;
                if (this.max.y < this.lastPos.y)    this.max.y = this.lastPos.y;
            }
            if ('Z' in blocks) {
                moving = true;
                if (this.#obsolute) {
                    this.lastPos.z = this.#scale.z*parseFloat(blocks['Z'], 10);
                }
                else {
                    this.lastPos.z += this.#scale.z*parseFloat(blocks['Z'], 10);
                }
                if (this.min.z > this.lastPos.z)    this.min.z = this.lastPos.z;
                if (this.max.z < this.lastPos.z)    this.max.z = this.lastPos.z;
            }
            if ('I' in blocks) {
                moving = true;
                this.lastPos.i = this.#scale.x*parseFloat(blocks['I'], 10);
            }
            if ('J' in blocks) {
                moving = true;
                this.lastPos.j = this.#scale.y*parseFloat(blocks['J'], 10);
            }
            if ('K' in blocks) {
                moving = true;
                this.lastPos.k = this.#scale.z*parseFloat(blocks['K'], 10);
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

            if (this.valid(this.lastG) && moving) {
                if (this.lastG <= 1) {
                    if (this.lastG == 0) {
                        if (figure != null) {
                            figures.push(figure);
                            figure = null;
                        }
                    }
                    if (figure == null) {
                        figure = new Figure();
                    }
                    figure.append(this.lastG, (n+1), linePos, this.lastPos.x, this.lastPos.y, this.lastPos.z);
                }
                else if (this.lastG <= 3) {
                    if (figure == null) {
                        figure = new Figure();
                    }
                    figure.append(this.lastG, (n+1), linePos, this.lastPos.x, this.lastPos.y, this.lastPos.z, this.lastPos.i, this.lastPos.j, this.lastPos.k);
                }
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
    getCode(x, y) {
        let col = Math.floor(x/this.#indexBlock);
        let row = Math.floor(y/this.#indexBlock);

        if ((row in this.#pathIndex) && (col in this.#pathIndex[row])) {
        }
    }
}

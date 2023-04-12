//https://www.isoplotec.co.jp/HPGL/eHPGL.htm
class HpglParser {
    #scale;
    #obsolute;

    #lastType;
    #curFig;
    #figList;
    constructor(opt) {
        this.inited = false;
        Object.assign(this, opt);

        this.#scale = {x:0.025, y:0.025};
        this.#obsolute = true;

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
        this.#lastType = -1;
        this.lastPos = {x:null,y:null,z:null,i:null,j:null,k:null};
        this.min = {
            x: Number.MAX_VALUE,
            y: Number.MAX_VALUE
        };
        this.max = {
            x: Number.MIN_VALUE,
            y: Number.MIN_VALUE
        };

        this.#curFig = null;
        this.#figList = [];

        if (!this.#obsolute) {
            this.lastPos = {x:0,y:0,z:0,i:0,j:0,k:0};
        }

        let cmdPos = -1;
        let cmd = '';
        let value = '';
        for(let c = 0; c < data.length; c ++) {
            if (data[c] == ' ') {
                continue;
            }
            if (data[c] == '\t') {
                continue;
            }
            if (data[c] == '\r') {
                continue;
            }
            if (data[c] == '\n') {
                continue;
            }
            if ((data[c] >= 'A') && (data[c] <= 'Z')) {
                if ((cmd.length > 0) && (value.length > 0)) {
                    this.processCmd(cmdPos, cmd, value);
                    cmd = '';
                    value = '';
                }
                if (!cmd) {
                    cmdPos = c;                    
                }
                cmd += data[c];
            }
            else if (data[c] == ';'){
                if ((cmd.length > 0) && (value.length > 0)) {
                    this.processCmd(cmdPos, cmd, value);
                }
                cmd = '';
                value = '';
            }
            else if (data[c] == '+'){
                value += data[c];
            }
            else if (data[c] == '-'){
                value += data[c];
            }
            else if (data[c] == '.'){
                value += data[c];
            }
            else if (data[c] == ','){
                value += data[c];
            }
            else if ((data[c] >= '0') && (data[c] <= '9')) {
                value += data[c];
            }
        }
        if ((cmd.length > 0) && (value.length > 0)) {
            this.processCmd(cmdPos, cmd, value);
            cmd = '';
            value = '';
        }

        if (this.#curFig != null) {
            this.#figList.push(this.#curFig);
        }
        this.#curFig = null;

        let figure = new Figure();
        figure.append(-1, -1, -1, this.min.x, this.min.y, 0, this.max.x, this.max.y, 0);
        this.#figList.unshift(figure);

        return this.#figList;
    }
    getPoints(value) {
        //this.lastPos
        let values = value.split(',');
        if (!values || (values.length < 2)) {
            return [];
        }
        let points = [];
        let x = this.lastPos.x;
        let y = this.lastPos.y;
        for(let i = 0; i < values.length; i += 2) {
            if (this.#obsolute) {
                x = this.#scale.x*parseFloat(values[i], 10);
            }
            else {
                x += this.#scale.x*parseFloat(values[i], 10);
            }
            if (this.min.x > x)    this.min.x = x;
            if (this.max.x < x)    this.max.x = x;

            if (this.#obsolute) {
                y = this.#scale.y*parseFloat(values[i+1], 10);
            }
            else {
                y += this.#scale.y*parseFloat(values[i+1], 10);
            }
            if (this.min.y > y)    this.min.y = y;
            if (this.max.y < y)    this.max.y = y;

            points.push(x);
            points.push(y);
        }
        return points;
    }
    processCmd(cmdPos, cmd, value) {
        cmd = cmd.toUpperCase();
        let gType = -1;
        if ((cmd == 'PU') || (cmd == 'U')) {
            gType = 0;
        }
        else if ((cmd == 'PD') || (cmd == 'D')) {
            gType = 1;
        }
        else if (cmd == 'PA') { //PA X,Y[,...][;] or PA[;]
            this.#obsolute = true;
            gType = 1;
        }
        else if (cmd == 'PR') { //PR X,Y[,...][;] or PA[;]
            this.#obsolute = false;
            gType = 1;
        }

        if (gType != -1) {
            let points = this.getPoints(value);
            if (points.length >= 2) {
                if (gType == 0) {
                    if (this.#curFig != null) {
                        this.#figList.push(this.#curFig);
                    }
                    this.#curFig = null;
                }
                else {
                    if (this.#lastType == 0) {
                        if (this.#curFig == null) {
                            this.#curFig = new Figure();
                        }
                        this.#curFig.append(0, -1, cmdPos, this.lastPos.x, this.lastPos.y, 0);
                    }
                }
    
                for(let i = 0; i < points.length; i += 2) {
                    if (gType != 0) {
                        if (this.#curFig == null) {
                            this.#curFig = new Figure();
                        }
                        this.#curFig.append(gType, -1, cmdPos, points[i], points[i+1], 0);
                    }
                    this.lastPos.x = points[i];
                    this.lastPos.y = points[i+1];
                    this.lastPos.z = 0;
                }

                this.#lastType = gType;
            }
        }
    }
}

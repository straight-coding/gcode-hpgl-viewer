class FormatParser {
    #gcode;
    #hpgl;
    #dpml;
    constructor() {
        this.#gcode = {
            'A':0,
            'B':0,
            'C':0,
            'D':0,
            'F':0,
            'G':0,
            'H':0,
            'I':0,
            'J':0,
            'K':0,
            'L':0,
            'M':0,
            'N':0,
            'P':0,
            'Q':0,
            'R':0,
            'S':0,
            'T':0,
            'X':0,
            'Y':0,
            'Z':0
        };
        this.#hpgl = {
            'IN':0,
            'PA':0,
            'PR':0,
            'PU':0,
            'PD':0,
            'AA':0,
            'AR':0,
            'CI':0,
            'SP':0
        };
        this.#dpml = {
            ';:':0,
            ';:I':0,
            '@':0,
            'A':0,
            'D':0,
            'F':0,
            'H':0,
            'L':0,
            'M':0,
            'O':0,
            'P':0,
            'Q':0,
            'R':0,
            'S':0,
            'T':0,
            'U':0,
            'V':0,
            'W':0,
            'Z':0
        };
    }
    detect(data, size) {
        let gcodeCount = 0;
        let hpglCount = 0;
        let dpmlCount = 0;

        for(let key in this.#gcode) {
            this.#gcode[key] = 0;
        }
        for(let key in this.#hpgl) {
            this.#hpgl[key] = 0;
        }
        for(let key in this.#dpml) {
            this.#dpml[key] = 0;
        }

        let cmd = '';
        let value = '';
        for(let c = 0; c < data.length; c ++) {
            if (size && (c > size)) {
                break;
            }
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
                    cmd = cmd.toUpperCase();
                    if (cmd in this.#gcode) {
                        gcodeCount ++;
                        this.#gcode[cmd] ++;
                    }
                    if (cmd in this.#hpgl) {
                        hpglCount ++;
                        this.#hpgl[cmd] ++;
                    }
                    if (cmd in this.#dpml) {
                        dpmlCount ++;
                        this.#dpml[cmd] ++;
                    }
                    cmd = '';
                    value = '';
                }
                cmd += data[c];
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

        if ((gcodeCount > 0) && (gcodeCount > hpglCount) && (gcodeCount > dpmlCount)) {
            return 'gcode';
        }
        if ((hpglCount > 0) && (hpglCount > gcodeCount) && (hpglCount > dpmlCount)) {
            return 'hpgl';
        }
        if ((dpmlCount > 0) && (dpmlCount > gcodeCount) && (dpmlCount > hpglCount)) {
            return 'dpml';
        }
        return null;
    }
}

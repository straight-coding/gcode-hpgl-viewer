const AREA_CANVAS = 0;
const AREA_TOOLBAR = 1;
const AREA_RULER = 2;
const AREA_DATA = 3;

const HEADLEN = 3;

class Point {
}
class Line {
}
class Arc {
}

class NiceScale {
    constructor(lowerBound, upperBound, _maxTicks) {
        this.maxTicks = _maxTicks || 10;
        this.upperBound = upperBound; 
        this.lowerBound = lowerBound;
        this.tickSpacing;
        this.range;
        this.niceLowerBound;
        this.niceUpperBound;

        this.calculate();
    }
    setMaxTicks(_maxTicks) {
        this.maxTicks = _maxTicks;
        this.calculate();
    }
    getNiceUpperBound() {
        return this.niceUpperBound;
    }
    getNiceLowerBound() {
        return this.niceLowerBound;
    }
    getTickSpacing() {
        return this.tickSpacing;
    }
    setMinMaxPoints(min, max) {
        this.lowerBound = min;
        this.upperBound = max;

        this.calculate();
    }
    calculate () {
        this.range = this.niceNum(this.upperBound - this.lowerBound, false);
        this.tickSpacing = this.niceNum(this.range / (this.maxTicks - 1), true);
        this.niceLowerBound = Math.floor(this.lowerBound / this.tickSpacing) * this.tickSpacing;
        this.niceUpperBound = Math.ceil(this.upperBound / this.tickSpacing) * this.tickSpacing;
    }
    niceNum(range, round) {
        var exponent = Math.floor(Math.log10(range));
        var fraction = range / Math.pow(10, exponent);
        var niceFraction;

        if (round) {
            if (fraction < 1.5) niceFraction = 1;
            else if (fraction < 3) niceFraction = 2;
            else if (fraction < 7) niceFraction = 5;
            else niceFraction = 10;
        } else {
            if (fraction <= 1) niceFraction = 1;
            else if (fraction <= 2) niceFraction = 2;
            else if (fraction <= 5) niceFraction = 5;
            else niceFraction = 10;
        }
        return niceFraction * Math.pow(10, exponent);
    }
}

class Viewer2D {
    constructor(opt) {
        this.inited = false;
        this.elemCanvas = opt.canvas;
        this.ctx = this.elemCanvas.getContext("2d", { 
                //alpha: true, 
                //desynchronized: false, 
                //colorSpace: 'srgb', 
                willReadFrequently: true 
            });
        this.margin = {
            left:20,
            top:20,
            right:20,
            bottom:20
        };
        this.toolbar = {
            left:20,
            top:20,
            right:20,
            bottom:20
        };
        this.ruler = {
            left:30,
            top:30,
            right:30,
            bottom:30,
            majorSize:8,
            minorSize:4
        };
        this.grid = {
            size: 100
        };
        this.dataWin = {
            minX: 0,
            minY: 0,
            maxX: 500,
            maxY: 500
        }
        this.scale = {
            x: 1.0,
            y: 1.0
        }
        this.lastDragPoint = null;
        this.showDataPoint = false;

        Object.assign(this, opt);

        this.init();
    }
    valid(obj) {
        return ((obj != undefined) && (obj != null));
    }
    init() {
        const _this = this;

        _this.drawStack = [];

        _this.setViewPort();

        _this.bindEvents();

        _this.inited = true;

        _this.redraw();
    }
    setViewPort() {
        const _this = this;

        let rcCan = _this.elemCanvas.getBoundingClientRect();
        _this.viewPort = {
            x: 0,
            y: 0,
            width: rcCan.width,
            height: rcCan.height 
        }

        if (_this.valid(this.margin)) {
            _this.viewPort.x += (this.margin.left || 0);
            _this.viewPort.y += (this.margin.top || 0);
            _this.viewPort.width -= (this.margin.left || 0);
            _this.viewPort.width -= (this.margin.right || 0);
            _this.viewPort.height -= (this.margin.top || 0);
            _this.viewPort.height -= (this.margin.bottom || 0);
        }
        if (_this.valid(this.toolbar)) {
            _this.viewPort.x += (this.toolbar.left || 0);
            _this.viewPort.y += (this.toolbar.top || 0);
            _this.viewPort.width -= (this.toolbar.left || 0);
            _this.viewPort.width -= (this.toolbar.right || 0);
            _this.viewPort.height -= (this.toolbar.top || 0);
            _this.viewPort.height -= (this.toolbar.bottom || 0);
        }
        if (_this.valid(this.ruler)) {
            _this.viewPort.x += (this.ruler.left || 0);
            _this.viewPort.y += (this.ruler.top || 0);
            _this.viewPort.width -= (this.ruler.left || 0);
            _this.viewPort.width -= (this.ruler.right || 0);
            _this.viewPort.height -= (this.ruler.top || 0);
            _this.viewPort.height -= (this.ruler.bottom || 0);
        }

        _this.dataWin.maxX = _this.dataWin.minX + _this.viewPort.width / _this.scale.x;
        _this.dataWin.maxY = _this.dataWin.minY + _this.viewPort.height / _this.scale.y;
    }
    bindEvents() {
        const _this = this;

        _this.elemCanvas.addEventListener('mousedown', function(e) { _this.onMouseDown(e) }, true);
        _this.elemCanvas.addEventListener('mousemove', function(e) { _this.onMouseMove(e) }, true);
        _this.elemCanvas.addEventListener('mouseup', function(e) { _this.onMouseUp(e) }, true);

        _this.elemCanvas.addEventListener('mousewheel', function(e) { _this.onMouseWheel(e) }, true);
        _this.elemCanvas.addEventListener('DOMMouseScroll', function(e) { _this.onMouseWheel(e) }, true);
    }
    static getImage(ctx, x, y, width, height) {
        return ctx.getImageData(Math.max(0,x), Math.max(0,y), width, height);
    }
    static drawImage(ctx, img, x, y) {
        ctx.putImageData(img, x, y);
    }
    static lineFrom(ctx, x, y) {
        ctx.moveTo(parseInt(x, 10) + 0.5, parseInt(y, 10) + 0.5);
    }
    static lineTo(ctx, x, y) {
        ctx.lineTo(parseInt(x, 10) + 0.5, parseInt(y, 10) + 0.5);
    }
    static drawRect(ctx, x, y, width, height) {
        Viewer2D.lineFrom(ctx, x, y);
        Viewer2D.lineTo(ctx, x+width, y);
        Viewer2D.lineTo(ctx, x+width, y+height);
        Viewer2D.lineTo(ctx, x, y+height);
        Viewer2D.lineTo(ctx, x, y);
    }
    static drawCircle(ctx, center, radius) {
        ctx.arc(parseInt(center[0],10)+0.5, parseInt(center[1],10)+0.5, radius, 0, 2*Math.PI);
    }
    static drawArc(ctx, gType, from, center, to) {
        let counterclockwise = true;
        if (gType == 2) {
            counterclockwise = false;
        }

        let dltX1 = from[0]-center[0];
        let dltY1 = from[1]-center[1];
        let radius = Math.sqrt(dltX1 * dltX1 + dltY1 * dltY1);
        let startAngle = Math.atan2(dltY1, dltX1);

        let dltX2 = to[0]-center[0];
        let dltY2 = to[1]-center[1];
        let endAngle = Math.atan2(dltY2, dltX2);

        if (Math.abs(startAngle-endAngle) < Number.EPSILON) {
            ctx.arc(parseInt(center[0],10)+0.5, parseInt(center[1],10)+0.5, radius, 0, 2*Math.PI);
        }
        else {
            ctx.arc(parseInt(center[0],10)+0.5, parseInt(center[1],10)+0.5, radius, startAngle, endAngle, counterclockwise);
        }
    }
    static fillRect(ctx, x, y, width, height) {
        ctx.fillRect(parseInt(x, 10) + 0.5, parseInt(y, 10) + 0.5, width, height);
    }
    restoreBackground() {
        const _this = this;

        if (_this.drawStack.length > 0) {
            for(let i = 0; i < _this.drawStack.length; i ++) {
                let img = _this.drawStack[i].image;
                let x = _this.drawStack[i].x;
                let y = _this.drawStack[i].y;
                Viewer2D.drawImage(_this.ctx, img, parseInt(x, 10) + 0.5, parseInt(y, 10) + 0.5);
            }
        }
        _this.drawStack = [];
    }
    clearArea(area) {
        const _this = this;
        let rcCan = _this.elemCanvas.getBoundingClientRect();

        let rect = {
            x: 0,
            y: 0,
            width: rcCan.width,
            height: rcCan.height
        };

        let color = '#FFFFFF';

        if (area >= AREA_CANVAS) {
        }
        if (area >= AREA_TOOLBAR) {
            color = '#444444';

            rect.x += (_this.margin.left || 0);
            rect.y += (_this.margin.top || 0);
            rect.width  -=  ((_this.margin.left || 0) + (_this.margin.right || 0));
            rect.height -= ((_this.margin.top || 0) + (_this.margin.bottom || 0));
        }
        if (area >= AREA_RULER) {
            color = '#FFFFFF';

            rect.x += (_this.toolbar.left || 0);
            rect.y += (_this.toolbar.top || 0);
            rect.width  -=  ((_this.toolbar.left || 0) + (_this.toolbar.right || 0));
            rect.height -= ((_this.toolbar.top || 0) + (_this.toolbar.bottom || 0));
        }
        if (area >= AREA_DATA) {
            color = '#FFFFFF';

            rect.x += (_this.ruler.left || 0);
            rect.y += (_this.ruler.top || 0);
            rect.width  -=  ((_this.ruler.left || 0) + (_this.ruler.right || 0));
            rect.height -= ((_this.ruler.top || 0) + (_this.ruler.bottom || 0));
        }

        //console.log('clearBox', rect);

        _this.ctx.save();
            _this.ctx.fillStyle = color;
            Viewer2D.fillRect(_this.ctx, rect.x, rect.y, rect.width, rect.height);
        _this.ctx.restore();
    }
    resize() {
        const _this = this;

        _this.setViewPort();
        _this.redraw();
    }
    redraw(e) {
        const _this = this;

        _this.restoreBackground();

        _this.ctx.save();
        {
            _this.clearArea(AREA_CANVAS);
            _this.drawCanvas();

            _this.clearArea(AREA_TOOLBAR);
            _this.drawToolbar();

            _this.clearArea(AREA_RULER);
            _this.drawRuler();

            _this.clearArea(AREA_DATA);
            _this.drawWorkSpace();

            _this.drawGrid();

            _this.drawData();

            if (e) {
                _this.drawCrosshair(e);
            }
        }
        _this.ctx.restore();
    }
    drawCanvas() {
        const _this = this;
        let rcCan = _this.elemCanvas.getBoundingClientRect();

        _this.ctx.save();

        _this.ctx.strokeStyle = '#FF0000';

        _this.ctx.beginPath();
        Viewer2D.drawRect(_this.ctx, 0, 0, rcCan.width-1, rcCan.height-1);
        _this.ctx.stroke();

        _this.ctx.restore();
    }
    drawToolbar() {
        const _this = this;
        _this.ctx.save();

        _this.ctx.restore();
    }
    drawRuler() {
        const _this = this;
        _this.ctx.save();

        let xCount = 20;
        let yCount = 20;
        if (_this.viewPort.width < _this.viewPort.height) {
            xCount = yCount * (_this.viewPort.width / _this.viewPort.height);
        }
        else {
            yCount = xCount * (_this.viewPort.height / _this.viewPort.width);
        }
        let niceScaleX = new NiceScale(_this.dataWin.minX, _this.dataWin.maxX, xCount);
        let niceScaleY = new NiceScale(_this.dataWin.minY, _this.dataWin.maxY, yCount);

        niceScaleY.tickSpacing = niceScaleX.tickSpacing;

        _this.ctx.strokeStyle = '#000000';
        let dx = niceScaleX.getNiceLowerBound();
        let vy = _this.viewPort.y + _this.viewPort.height;
        while(dx <= _this.dataWin.maxX + niceScaleX.tickSpacing) {
            let vx = _this.viewPort.x + (dx-_this.dataWin.minX) * _this.scale.x;
            _this.ctx.beginPath();
                if ((vx >= _this.viewPort.x) && (vx <= _this.viewPort.x + _this.viewPort.width)) {
                    Viewer2D.lineFrom(_this.ctx, vx, vy);
                    Viewer2D.lineTo(_this.ctx, vx, vy + _this.ruler.majorSize);
                }
                let minx = vx - (niceScaleX.tickSpacing - niceScaleX.tickSpacing/5)*_this.scale.x;
                for(let i = 1; i < 5; i ++) {
                    if ((minx >= _this.viewPort.x) && (minx <= _this.viewPort.x + _this.viewPort.width)) {
                        Viewer2D.lineFrom(_this.ctx, minx, vy);
                        Viewer2D.lineTo(_this.ctx, minx, vy + _this.ruler.minorSize);
                    }
                    minx += (niceScaleX.tickSpacing/5)*_this.scale.x;
                    if (minx >= _this.viewPort.x + _this.viewPort.width) {
                        break;
                    }
                }
            _this.ctx.stroke();

            let xLabel = dx.toFixed(0);
            _this.ctx.save();
            _this.ctx.textAlign = "center";
            if ((vx >= _this.viewPort.x) && (vx <= _this.viewPort.x + _this.viewPort.width)) {
                _this.ctx.fillText(''+xLabel, vx, vy + 2*_this.ruler.majorSize + 3);
            }
            _this.ctx.restore();

            dx += niceScaleX.tickSpacing;
        }

        let dy = niceScaleY.getNiceLowerBound();
        let vx = _this.viewPort.x;
        while(dy <= _this.dataWin.maxY + niceScaleY.tickSpacing) {
            let vy = _this.viewPort.y + _this.viewPort.height - (dy-_this.dataWin.minY) * _this.scale.y;
            _this.ctx.beginPath();
            if ((vy >= _this.viewPort.y) && (vy <= _this.viewPort.y + _this.viewPort.height)) {
                Viewer2D.lineFrom(_this.ctx, vx, vy);
                Viewer2D.lineTo(_this.ctx, vx - _this.ruler.majorSize, vy);
            }
            let miny = vy - (niceScaleY.tickSpacing - niceScaleY.tickSpacing/5)*_this.scale.y;
            for(let i = 1; i < 5; i ++) {
                if ((miny >= _this.viewPort.y) && (miny <= _this.viewPort.y + _this.viewPort.height)) {
                    Viewer2D.lineFrom(_this.ctx, vx, miny);
                    Viewer2D.lineTo(_this.ctx, vx - _this.ruler.minorSize, miny);
                }
                miny += (niceScaleY.tickSpacing/5)*_this.scale.y;
                if (miny >= _this.viewPort.y + _this.viewPort.height) {
                    break;
                }
            }
            _this.ctx.stroke();

            let yLabel = dy.toFixed(0);
            _this.ctx.save();
            _this.ctx.textAlign = "center";
            _this.ctx.translate(vx-_this.ruler.majorSize, vy);
            _this.ctx.rotate(-Math.PI/2);
            if ((vy >= _this.viewPort.y) && (vy <= _this.viewPort.y + _this.viewPort.height)) {
                _this.ctx.fillText(''+yLabel, 0, -2);
            }
            _this.ctx.restore();
            dy += niceScaleY.tickSpacing;
        }

        _this.ctx.restore();
    }
    drawWorkSpace() {
        const _this = this;
        let rcClip = _this.getClipRect();

        _this.ctx.save();

        _this.ctx.beginPath();

        _this.ctx.strokeStyle = '#d0d0d0';
        Viewer2D.drawRect(_this.ctx, rcClip.left, rcClip.top, rcClip.width, rcClip.height);
        
        _this.ctx.stroke();

        _this.ctx.restore();
    }
    drawGrid() {
        const _this = this;
        let rcClip = _this.getClipRect();

        _this.ctx.save();

        let region = new Path2D();
        region.rect(rcClip.left, rcClip.top, rcClip.width, rcClip.height);
        _this.ctx.clip(region);

        _this.ctx.restore();
    }
    drawData() {
        const _this = this;
        let rcClip = _this.getClipRect();

        _this.ctx.save();

        let region = new Path2D();
        region.rect(rcClip.left, rcClip.top, rcClip.width, rcClip.height);
        _this.ctx.clip(region);

        if (_this.data)
        {
            let lastCmd=-1;

            let lastDx;
            let lastDy;
            let lastDz;

            let lastVx;
            let lastVy;
            let lastVz;

            let pointsG1 = [];
            let pointsG2 = [];
            let pointsG3 = [];

            let EOF = false;
            for(let i = 1; i < _this.data.length; i ++) {
                let figure = _this.data[i];

                _this.ctx.save();

                if (figure.selected) {
                    _this.ctx.strokeStyle = '#FF0000';
                }
                else {
                    _this.ctx.strokeStyle = '#000000';
                }
    
                _this.ctx.beginPath();
    
                for(let f = 0; f < figure.points.length; f ++) {
                    let node = figure.points[f];

                    if (node[0] < 0) {
                        EOF = true;
                        break;
                    }
                    let vx = _this.viewPort.x + (node[HEADLEN] - _this.dataWin.minX) * _this.scale.x;
                    let vy = _this.viewPort.y + _this.viewPort.height - (node[HEADLEN+1] - _this.dataWin.minY) * _this.scale.y;
                    let vz = (node[HEADLEN+2]) * _this.scale.x;
                    if (node[0] == 0) {
                        Viewer2D.lineFrom(_this.ctx, vx, vy);
                    }
                    else if (node[0] <= 1) {
                        Viewer2D.lineTo(_this.ctx, vx, vy);
                        pointsG1.push(vx);
                        pointsG1.push(vy);
                    }
                    else if (node[0] <= 3) {
                        let cvx = _this.viewPort.x + (lastDx + node[HEADLEN+3] - _this.dataWin.minX) * _this.scale.x;
                        let cvy = _this.viewPort.y + _this.viewPort.height - (lastDy + node[HEADLEN+4] - _this.dataWin.minY) * _this.scale.y;
                        let cvz = (lastDz + node[HEADLEN+5]) * _this.scale.x;

                        if ((lastCmd != 0) && (Math.abs(lastVx-vx) < Number.EPSILON) && (Math.abs(lastVy-vy) < Number.EPSILON)) {
                            Viewer2D.lineTo(_this.ctx, vx, vy);
                        }
                        else {
                            Viewer2D.drawArc(_this.ctx, node[0], [lastVx,lastVy,lastVz], [cvx,cvy,cvz], [vx,vy,vz]);
                        }
                        if (node[0] == 2) {
                            pointsG2.push(vx);
                            pointsG2.push(vy);
                        }
                        else if (node[0] == 3) {
                            pointsG3.push(vx);
                            pointsG3.push(vy);
                        }
                    }
                    else if (node[0] == 17) {
                        //plane XY
                    }
                    else if (node[0] == 18) {
                        //plane ZX
                    }
                    else if (node[0] == 19) {
                        //plane YZ
                    }
                    else {
                        continue;
                    }

                    lastCmd = node[0];

                    lastDx = node[HEADLEN];
                    lastDy = node[HEADLEN+1];
                    lastDz = node[HEADLEN+2];

                    lastVx = vx;
                    lastVy = vy;
                    lastVz = vz;
                }

                _this.ctx.stroke();
                _this.ctx.restore();
    
                if (EOF) {
                    break;
                }
            }

            if (_this.showDataPoint) {
                _this.ctx.save();
                
                _this.ctx.beginPath();
                _this.ctx.strokeStyle = '#000000';
                for(let i = 0; i < pointsG1.length; i += 2) {
                    Viewer2D.lineFrom(_this.ctx, pointsG1[i], pointsG1[i+1]);
                    Viewer2D.drawCircle(_this.ctx, [pointsG1[i], pointsG1[i+1]], 2);
                }
                _this.ctx.stroke();
                _this.ctx.beginPath();
                _this.ctx.strokeStyle = '#00FF00';
                for(let i = 0; i < pointsG2.length; i += 2) {
                    Viewer2D.lineFrom(_this.ctx, pointsG2[i], pointsG2[i+1]);
                    Viewer2D.drawCircle(_this.ctx, [pointsG2[i], pointsG2[i+1]], 2);
                }
                _this.ctx.stroke();
                _this.ctx.beginPath();
                _this.ctx.strokeStyle = '#0000FF';
                for(let i = 0; i < pointsG3.length; i += 2) {
                    Viewer2D.lineFrom(_this.ctx, pointsG3[i], pointsG3[i+1]);
                    Viewer2D.drawCircle(_this.ctx, [pointsG3[i], pointsG3[i+1]], 2);
                }
                _this.ctx.stroke();

                _this.ctx.restore();
            }
        }

        _this.ctx.restore();
    }
    getClipRect() {
        const _this = this;
        let rect = {
            left: _this.viewPort.x,
            top: _this.viewPort.y,
            right: _this.viewPort.x + _this.viewPort.width,
            bottom: _this.viewPort.y + _this.viewPort.height
        };
        rect.width = _this.viewPort.width;
        rect.height = _this.viewPort.height;
        return rect;
    }
    drawCrosshair(e) {
        const _this = this;
        let rcClip = _this.getClipRect();

        let rcCan = _this.elemCanvas.getBoundingClientRect();
        let xCan = e.clientX - rcCan.left;
        let yCan = e.clientY - rcCan.top;

        if ((xCan < rcClip.left) || (xCan > rcClip.left + rcClip.width) ||
            (yCan < rcClip.top) || (yCan > rcClip.top + rcClip.height)) {
            return;
        }

        let stripWidth = 100;

        let imgHorz = Viewer2D.getImage(_this.ctx, 0, yCan - stripWidth, rcCan.width, 2*stripWidth);
        _this.drawStack.push({ image:imgHorz, x: 0, y: yCan - stripWidth });

        let imgVert = Viewer2D.getImage(_this.ctx, xCan - stripWidth, 0, 2*stripWidth, rcCan.height);
        _this.drawStack.push({ image: imgVert, x: xCan - stripWidth, y: 0 });

        _this.ctx.save();

        let region = new Path2D();
        region.rect(rcClip.left, rcClip.top, rcClip.width, rcClip.height);
        _this.ctx.clip(region);

        _this.ctx.strokeStyle = '#000';
        _this.ctx.setLineDash([2, 4]);

        _this.ctx.beginPath();

        //horz line
        Viewer2D.lineFrom(_this.ctx, 0, yCan);
        Viewer2D.lineTo(_this.ctx, rcCan.width, yCan);

        //vert line
        Viewer2D.lineFrom(_this.ctx, xCan, 0);
        Viewer2D.lineTo(_this.ctx, xCan, rcCan.height);

        _this.ctx.stroke();

        let xData = _this.dataWin.minX + (xCan - _this.viewPort.x) / _this.scale.x;
        let xLabel = xData.toFixed(0);
        let yData = _this.dataWin.minY + (_this.viewPort.height - (yCan - _this.viewPort.y)) / _this.scale.y;
        let yLabel = yData.toFixed(0);

        let labelLength = 50;
        let labelWidth = 14;

        _this.ctx.beginPath();
        _this.ctx.fillStyle = '#FFFFFF';
        Viewer2D.fillRect(_this.ctx, xCan-labelLength/2, _this.viewPort.y+1, labelLength, labelWidth);
        Viewer2D.fillRect(_this.ctx, _this.viewPort.x+_this.viewPort.width-labelWidth-1, yCan-labelLength/2, labelWidth, labelLength);
        _this.ctx.stroke();

        _this.ctx.beginPath();
        _this.ctx.setLineDash([]);
        _this.ctx.strokeStyle = '#D6D6D6';
        Viewer2D.drawRect(_this.ctx, xCan-labelLength/2, _this.viewPort.y+1, labelLength, labelWidth);
        Viewer2D.drawRect(_this.ctx, _this.viewPort.x+_this.viewPort.width-labelWidth-1, yCan-labelLength/2, labelWidth, labelLength);
        _this.ctx.stroke();

        _this.ctx.beginPath();
        _this.ctx.textAlign = "center";
        _this.ctx.strokeStyle = '#000';
        _this.ctx.fillStyle = '#000';
        _this.ctx.fillText(''+xLabel, xCan, _this.viewPort.y + labelWidth - 2);
        _this.ctx.stroke();

        _this.ctx.beginPath();
        _this.ctx.textAlign = "center";
        _this.ctx.strokeStyle = '#000';
        _this.ctx.fillStyle = '#000';
        _this.ctx.translate(_this.viewPort.x + _this.viewPort.width - labelWidth, yCan);
        _this.ctx.rotate(+Math.PI/2);
        _this.ctx.fillText(''+yLabel, 0, -3);
        _this.ctx.stroke();

        _this.ctx.restore();
    }
    moveDataWin(moved) {
        const _this = this;

        let dataMoved = {
            x: moved.x / _this.scale.x,
            y: moved.y / _this.scale.y
        }

        _this.dataWin.minX -= dataMoved.x;
        _this.dataWin.minY += dataMoved.y;
        _this.dataWin.maxX -= dataMoved.x;
        _this.dataWin.maxY += dataMoved.y;

        _this.redraw();
    }
    setData(data) {
        const _this = this;
        if (!data || (data.length == 0)) {
            return;
        }
        let dim = data[0].points[0];
        if (dim[0] != -1) {
            return;
        }
        _this.dataWin.minX = dim[HEADLEN]-10;
        _this.dataWin.minY = dim[HEADLEN+1]-10;
        _this.dataWin.maxX = dim[HEADLEN+3]+10;
        _this.dataWin.maxY = dim[HEADLEN+4]+10;

        _this.data = data;

        _this.updateScale();
        _this.redraw();
    }
    updateScale() {
        const _this = this;

        _this.scale.x = (_this.viewPort.width) / (_this.dataWin.maxX - _this.dataWin.minX);
        _this.scale.y = (_this.viewPort.height) / (_this.dataWin.maxY - _this.dataWin.minY);

        _this.scale.x = Math.min(_this.scale.x, _this.scale.y);
        _this.scale.y = _this.scale.x;

        let minX = (_this.dataWin.minX + _this.dataWin.maxX)/2 - (_this.viewPort.width / _this.scale.x)/2;
        let minY = (_this.dataWin.minY + _this.dataWin.maxY)/2 - (_this.viewPort.height / _this.scale.y)/2;

        _this.dataWin.minX = minX;
        _this.dataWin.minY = minY;
        _this.dataWin.maxX = minX + _this.viewPort.width / _this.scale.x;
        _this.dataWin.maxY = minY + _this.viewPort.height / _this.scale.y;
    }
    onMouseDown(e) {
        const _this = this;
        if (!_this.inited)
            return;

        e.preventDefault();
        if (e.which == 1) {
            _this.elemCanvas.style.cursor = 'move';
            _this.lastDragPoint = {
                x: e.clientX,
                y: e.clientY,
            };
            _this.redraw(e);
        }
    }
    onMouseMove(e) {
        const _this = this;
        if (!_this.inited)
            return;
        //console.log('onMouseMove', e.clientX, e.clientY);

        e.preventDefault();

        if (_this.lastDragPoint) {
            let moved = {
                x: e.clientX - _this.lastDragPoint.x,
                y: e.clientY - _this.lastDragPoint.y
            }
            _this.moveDataWin(moved);

            _this.lastDragPoint = {
                x: e.clientX,
                y: e.clientY,
            };
        }

        _this.redraw(e);
    }
    onMouseUp(e) {
        const _this = this;
        if (!_this.inited)
            return;
        e.preventDefault();

        _this.lastDragPoint = null;
        _this.elemCanvas.style.cursor = 'default';

        _this.redraw(e);
    }
    onMouseWheel(e) {
        const _this = this;
        if (!_this.inited)
            return;
        e.preventDefault();

        var evt = window.event || e; // old IE support
        var delta = Math.max(-1, Math.min(1, (evt.wheelDelta || -evt.detail)));

        let rcCan = _this.elemCanvas.getBoundingClientRect();
        let vOffX = (e.clientX - rcCan.left - _this.viewPort.x);
        let vOffY = (e.clientY - rcCan.top  - _this.viewPort.y);
        let ptClicked = {
            x: _this.dataWin.minX + vOffX / _this.scale.x,
            y: _this.dataWin.minY + vOffY / _this.scale.y
        };

        if (delta < 0) {
            _this.scale.x *= 1.05;
        }
        else {
            _this.scale.x *= 0.95;
        }
        _this.scale.y = _this.scale.x;

        _this.dataWin.minX = ptClicked.x - vOffX/_this.scale.x;
        _this.dataWin.minY = ptClicked.y - vOffY/_this.scale.y;
        _this.dataWin.maxX = ptClicked.x + (_this.viewPort.width  - vOffX)/_this.scale.x;
        _this.dataWin.maxY = ptClicked.y + (_this.viewPort.height - vOffY)/_this.scale.y;

        //console.log('onMouseWheel', delta);
    }
    //Compute the dot product AB . BC
    dotProduct(pointA, pointB, pointC) {
        let AB = [0,0];
        let BC = [0,0];

        AB[0] = pointB[0] - pointA[0];
        AB[1] = pointB[1] - pointA[1];
        BC[0] = pointC[0] - pointB[0];
        BC[1] = pointC[1] - pointB[1];

        let dot = AB[0] * BC[0] + AB[1] * BC[1];
        return dot;
    }
    //Compute the cross product AB x AC
    crossProduct(pointA, pointB, pointC) {
        let AB = [0,0];
        let AC = [0,0];

        AB[0] = pointB[0] - pointA[0];
        AB[1] = pointB[1] - pointA[1];
        AC[0] = pointC[0] - pointA[0];
        AC[1] = pointC[1] - pointA[1];

        let cross = AB[0] * AC[1] - AB[1] * AC[0];
        return cross;
    }
    //Compute the distance from A to B
    distance(pointA, pointB) {
        let d1 = pointA[0] - pointB[0];
        let d2 = pointA[1] - pointB[1];

        return Math.Sqrt(d1 * d1 + d2 * d2);
    }
    //Compute the distance from AB to C
    //if isSegment is true, AB is a segment, not a line.
    lineToPointDistance2D(pointA, pointB, pointC, isSegment) {
        let dist = crossProduct(pointA, pointB, pointC) / distance(pointA, pointB);
        if (isSegment) {
            let dot1 = dotProduct(pointA, pointB, pointC);
            if (dot1 > 0) {
                return distance(pointB, pointC);
            }
            let dot2 = dotProduct(pointB, pointA, pointC);
            if (dot2 > 0) {
                return distance(pointA, pointC);
            }
        }
        return Math.Abs(dist);
    }     
}

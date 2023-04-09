class Figure {
    constructor() {
        this.inited = false;
        this.selected = true;
        this.points = [];
    }
    append() {
        this.points.push([...arguments]);
    }
}

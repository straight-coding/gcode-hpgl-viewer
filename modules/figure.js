class Figure {
    constructor() {
        this.inited = false;
        this.selected = false;
        this.points = [];
    }
    append() {
        this.points.push([...arguments]);
    }
}

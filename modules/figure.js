/*
  figure.js
  Author: Straight Coder<simpleisrobust@gmail.com>
  Date: April 13, 2023
*/

'use strict';

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

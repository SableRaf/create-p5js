import "p5/global";

//needed for p5.Vector, p5.Geometry, etc.
//import p5 from "p5";

window.setup = function setup(): void {
    createCanvas(400, 400);
    background(220);
};

window.draw = function draw(): void {
    line(pmouseX, pmouseY, mouseX, mouseY);
};

window.mousePressed = function mousePressed() {
    circle(mouseX, mouseY, random(10, 30));
};

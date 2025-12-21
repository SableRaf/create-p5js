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
    fill(randomColour());
    circle(mouseX, mouseY, random(10, 30));
};

function randomColour(): p5.Color {
    push();
    colorMode(HSB);
    const generatedColour = color(random(360), 70, 100);
    pop();
    return generatedColour;
}

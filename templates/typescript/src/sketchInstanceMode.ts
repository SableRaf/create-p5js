import p5 from "p5";

function sketch(p: p5) {
    p.setup = function setup(): void {
        p.createCanvas(400, 400);
        p.background("linen");
    };

    p.draw = function draw(): void {
        p.line(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
    };

    p.mousePressed = function mousePressed() {
        p.circle(p.mouseX, p.mouseY, 20);
    };
}

new p5(sketch);

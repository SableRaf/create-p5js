// Instance mode allows multiple sketches on one page
// and avoids polluting the global namespace

/** This function will be called by p5.
 * It is expected that in it we register "setup" and/or "draw" functions on the given p5 instance.
 * @param {p5} p - the p5 instance for our sketch.
 */
function sketch(p) {
  p.setup = () => {
    p.createCanvas(400, 400);
    p.background(220);
  };

  p.draw = () => {
    // Draw a simple circle that follows the mouse
    p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
}

// Create a new p5 instance, passing in the sketch function
new p5(sketch);

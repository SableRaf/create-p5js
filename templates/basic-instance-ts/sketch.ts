// Instance mode allows multiple sketches on one page
// and avoids polluting the global namespace

const sketch = (p: p5) => {
  p.setup = () => {
    p.createCanvas(400, 400);
    p.background(220);
  };

  p.draw = () => {
    // Draw a simple circle that follows the mouse
    p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };
};

// Create a new p5 instance, passing in the sketch function
new p5(sketch, 'sketch-container');

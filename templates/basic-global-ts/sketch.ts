function setup(): void {
  createCanvas(400, 400);
  background(220);
}

function draw(): void {
  // Draw a simple circle that follows the mouse
  ellipse(mouseX, mouseY, 50, 50);
}

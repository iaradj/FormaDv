
let img;
let circleDiameter;
let circleBaseDiameter;
let circleX, circleY;
let colors;
let movingRects = [];
let lastCycleTime = 0;
let shapeIndex = 0;
let isMouseDown = false;
let cursorColor;
let trail = [];
let lastTrailTime = 0;
let trailInterval = 120; // milisegundos entre formas del rastro

function preload() {
  img = loadImage("imagenes/fondo-liso.webp");
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.position(0, 0);
  angleMode(DEGREES);
  updateResponsiveSettings();
  generateRects();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateResponsiveSettings();
  generateRects();
}

function updateResponsiveSettings() {

  if (width <= 600) { 
    circleBaseDiameter = 120;
    circleX = width / 2;
    circleY = height / 2;
  } else if (width <= 1024) { 
    circleBaseDiameter = 240;
    circleX = width / 4;
    circleY = height / 2;
  } else { // desktop
    circleBaseDiameter = 300;
    circleX = width / 4;
    circleY = height / 2;
  }
  circleDiameter = circleBaseDiameter;

 
  colors = [
    color(25, 34, 25), // #192219
    color(196, 36, 0), // #C42400 (rojo)
    color(205, 135, 0), // #CD8700 (naranja)
    color(32, 103, 108), // #20676C (verde)
    color(108, 117, 91), // #6C755B
  ];

  // Color inicial del cursor
  cursorColor = random([colors[1], colors[2], colors[3]]);
}

function generateRects() {
  movingRects = [];
  let pausePoints = [];
  let attempts = 0;
  let maxRects = int(random(5, 10));

  let scaleFactor = 1;
  if (width <= 600) scaleFactor = 0.4;
  else if (width <= 1024) scaleFactor = 0.8;

  while (pausePoints.length < maxRects && attempts < 1000) {
    let angle = random(30, 60);
    let distance = random(0, circleBaseDiameter);
    let offset = p5.Vector.fromAngle(radians(random(0, 360))).mult(distance);
    let candidate = createVector(circleX, circleY).add(offset);

    let tooClose = false;
    for (let pt of pausePoints) {
      if (
        p5.Vector.dist(candidate, pt) < 5 ||
        p5.Vector.dist(candidate, pt) > 250
      ) {
        tooClose = true;
        break;
      }
    }

    if (!tooClose) {
      pausePoints.push(candidate);
      movingRects.push(new MovingRect(angle, candidate, scaleFactor));
    }

    attempts++;
  }
}

function draw() {

  background(255);
  tint(255, 100);
  image(img, 0, 0, width, height);

  let elapsed = millis() - lastCycleTime;
  let cycleDuration = 10000;

  if (elapsed > cycleDuration) {
    lastCycleTime = millis();
    generateRects();
    elapsed = 0;
  }

  drawPulsingCircle(elapsed);

  for (let r of movingRects) {
    r.update(elapsed);
    r.display();
  }

  updateCursorTrail();
  drawCursorTrail();

  drawCustomCursor();
}

function drawPulsingCircle(t) {
  let d = circleBaseDiameter;

  if (t < 4000) {
    let progress = t / 4000;
    d = lerp(circleBaseDiameter, circleBaseDiameter + 50, progress);
  } else if (t < 6000) {
    d = circleBaseDiameter + 50;
  } else if (t < 10000) {
    let progress = (t - 6000) / 4000;
    d = lerp(circleBaseDiameter + 50, circleBaseDiameter, progress);
  }

  noStroke();
  fill(169, 171, 132); // #A9AB84
  ellipse(circleX, circleY, d);
}

class MovingRect {
  constructor(angle, pausePoint, scale = 1) {
    this.angle = angle;
    this.pausePoint = pausePoint.copy();
    this.h = random(2, 30) * scale;
    this.w = random(50, 900) * scale;
    this.color = random(colors);

    let dir = p5.Vector.fromAngle(radians(this.angle));
    this.startPoint = p5.Vector.sub(this.pausePoint, dir.copy().mult(width));
    this.endPoint = p5.Vector.add(this.pausePoint, dir.copy().mult(width));
    this.pos = this.startPoint.copy();

    this.shouldRotate = random() < 0.25;
    this.rotationAmount = 0;
  }

  update(t) {
    if (t < 4000) {
      let p = t / 4000;
      let eased = easeOutQuad(p);
      this.pos = p5.Vector.lerp(this.startPoint, this.pausePoint, eased);

      if (this.shouldRotate) {
        this.rotationAmount = lerp(0, 90, eased);
      }
    } else if (t < 6000) {
      this.pos = this.pausePoint.copy();
      this.rotationAmount = this.shouldRotate ? 90 : 0;
    } else if (t < 10000) {
      let p = (t - 6000) / 4000;
      let eased = easeInQuad(p);
      this.pos = p5.Vector.lerp(this.pausePoint, this.endPoint, eased);

      if (this.shouldRotate) {
        this.rotationAmount = lerp(90, 0, eased);
      }
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle + this.rotationAmount);
    noStroke();
    fill(this.color);
    rect(-this.w / 2, -this.h / 2, this.w, this.h);
    pop();
  }
}

function drawCustomCursor() {
  push();
  translate(mouseX, mouseY);
  noStroke();

  if (isMouseDown) {
    fill(cursorColor);
    if (shapeIndex % 3 === 0) {
      ellipse(0, 0, 25);
    } else if (shapeIndex % 3 === 1) {
      rectMode(CENTER);
      rect(0, 0, 25, 25);
    } else {
      triangle(-12, 12, 12, 12, 0, -12);
    }
  }

  pop();
}

function updateCursorTrail() {
  if (millis() - lastTrailTime > trailInterval) {
    if (trail.length >= 5) {
      trail.shift(); 
    }

    trail.push({
      x: mouseX,
      y: mouseY,
      shape: shapeIndex % 3,
      color: cursorColor,
      alpha: 255
    });

    lastTrailTime = millis();
  }

  for (let t of trail) {
    t.alpha -= 4;
  }

  trail = trail.filter(t => t.alpha > 0);
}

function drawCursorTrail() {
  noFill();
  for (let t of trail) {
    stroke(t.color);
    strokeWeight(1);
    stroke(t.color.levels[0], t.color.levels[1], t.color.levels[2], t.alpha);

    push();
    translate(t.x, t.y);
    if (t.shape === 0) {
      ellipse(0, 0, 20);
    } else if (t.shape === 1) {
      rectMode(CENTER);
      rect(0, 0, 20, 20);
    } else {
      triangle(-10, 10, 10, 10, 0, -10);
    }
    pop();
  }
}

function easeOutQuad(x) {
  return 1 - (1 - x) * (1 - x);
}

function easeInQuad(x) {
  return x * x;
}

function mousePressed() {
  isMouseDown = true;
  shapeIndex++;
  cursorColor = random([colors[1], colors[2], colors[3]]);
}

function mouseReleased() {
  isMouseDown = false;
}

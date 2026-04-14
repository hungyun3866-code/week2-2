// ====== 全域變數 ======
let shapes = []; 
let bubbles = []; 
let song;
let amplitude;
let palette = ['#e9edc9', '#fce4ec', '#accbe1', '#eddcd2']; 
let points = [
  [-3, 5], [3, 7], [1, 5], [2, 4], [4, 3], [5, 2], [6, 2], [8, 4], 
  [8, -1], [6, 0], [0, -3], [2, -6], [-2, -3], [-4, -2], [-5, -1], [-6, 1], [-6, 2]
];

function preload() {
  song = loadSound('midnight-quirk-255361.mp3');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  amplitude = new p5.Amplitude();
  
  // 初始化魚群
  for (let i = 0; i < 12; i++) {
    let baseSize = random(10, 20);
    let scaledPoints = points.map(pt => ({ x: pt[0] * baseSize, y: pt[1] * baseSize }));
    shapes.push({
      x: random(width),
      y: random(height),
      dx: random(-2, 2),
      dy: random(-1.2, 1.2),
      color: color(palette[i % palette.length]),
      points: scaledPoints,
      flipY: random([-1, 1])
    });
  }

  // 初始化泡泡 (預先產生一些在畫面各處)
  for (let i = 0; i < 25; i++) {
    createNewBubble(random(height)); 
  }
}

function draw() {
  // 深一點的海底灰藍色背景
  background(240, 245, 250);
  
  let level = amplitude.getLevel();
  let sizeFactor = map(level, 0, 0.5, 0.8, 2.5);

  // --- 處理泡泡層 (由下往上) ---
  for (let i = bubbles.length - 1; i >= 0; i--) {
    bubbles[i].update();
    bubbles[i].display();
    if (bubbles[i].isDead) {
      bubbles.splice(i, 1);
      createNewBubble(height + 50); // 從底部重新生成
    }
  }

  // --- 處理魚群層 ---
  for (let s of shapes) {
    s.x += s.dx;
    s.y += s.dy;
    if (s.x < -50 || s.x > width + 50) s.dx *= -1;
    if (s.y < -50 || s.y > height + 50) s.dy *= -1;

    let flipX = (s.dx > 0) ? -1 : 1;

    push();
    translate(s.x, s.y);
    scale(sizeFactor * flipX, sizeFactor * s.flipY);
    fill(s.color);
    stroke(s.color);
    strokeWeight(1.5 / sizeFactor);
    beginShape();
    for (let pt of s.points) { vertex(pt.x, pt.y); }
    endShape(CLOSE);
    pop();
  }

  if (!song.isPlaying()) {
    fill(150); noStroke(); textAlign(CENTER); text("CLICK TO EXPLORE THE OCEAN", width/2, height-40);
  }
}

function createNewBubble(startY) {
  bubbles.push(new Bubble(random(width), startY));
}

// --- 泡泡類別 (上升版) ---
class Bubble {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = random(10, 35);
    this.speed = random(1, 3); // 向上飄的速度
    this.popY = random(50, height * 0.4); // 在靠近水面(上方)隨機破裂
    this.isPopping = false;
    this.alpha = 180;
    this.popScale = 1;
    this.noiseSeed = random(100); // 獨立的隨機種子讓擺動更自然
    this.particles = [];
    this.isDead = false;
  }

  update() {
    if (!this.isPopping) {
      this.y -= this.speed; // 【關鍵】Y 軸遞減代表向上
      // 模擬水流的 S 形擺動
      this.x += sin(frameCount * 0.03 + this.noiseSeed) * 0.8; 
      
      // 到達上方破裂線
      if (this.y <= this.popY) this.triggerPop();
    } else {
      this.popScale += 0.12;
      this.alpha -= 20;
      for (let p of this.particles) p.update();
      if (this.alpha <= 0 && this.particles.every(p => p.alpha <= 0)) this.isDead = true;
    }
  }

  triggerPop() {
    this.isPopping = true;
    for (let i = 0; i < 6; i++) this.particles.push(new Particle(this.x, this.y));
  }

  display() {
    if (this.alpha > 0) {
      push();
      translate(this.x, this.y);
      scale(this.popScale);
      
      // 泡泡主體
      fill(173, 216, 230, this.alpha * 0.4);
      stroke(220, 245, 255, this.alpha * 0.8);
      strokeWeight(1.2);
      ellipse(0, 0, this.size);
      
      // 立體感高光
      noStroke();
      fill(255, 255, 255, this.alpha * 0.7);
      ellipse(-this.size * 0.22, -this.size * 0.22, this.size * 0.3, this.size * 0.2);
      pop();
    }
    for (let p of this.particles) p.display();
  }
}

// --- 破裂粒子 ---
class Particle {
  constructor(x, y) {
    this.x = x; this.y = y;
    let angle = random(TWO_PI);
    let speed = random(0.5, 2.5);
    this.dx = cos(angle) * speed;
    this.dy = sin(angle) * speed;
    this.alpha = 200;
  }
  update() { 
    this.x += this.dx; 
    this.y += this.dy; 
    this.dy -= 0.05; // 破裂後的小水滴也會輕微上浮
    this.alpha -= 12; 
  }
  display() {
    if (this.alpha > 0) {
      noStroke(); fill(180, 230, 250, this.alpha);
      ellipse(this.x, this.y, random(1, 3));
    }
  }
}

function mousePressed() { song.isPlaying() ? song.pause() : song.loop(); }
function windowResized() { resizeCanvas(windowWidth, windowHeight); }
/*
  Delete but Never Clean · p5.js 多场景交互装置
  三文件结构：index.html / style.css / sketch.js

  界面：
  1. HomeScene      数字雨首页导航
  2. WheatScene     Chat History / 麦田拖拽割麦
  3. ProjectScene   Project Files / PROJECT 流水鼠标擦除
  4. ScreenshotScene Screenshot / 截图雨滴雾效

  运行方式：Cursor 打开文件夹 → 右键 index.html → Open with Live Server
*/

const APP_W = 1080;
const APP_H = 720;

let app;

function setup() {
  const cnv = createCanvas(APP_W, APP_H);
  cnv.parent("sketch-holder");
  pixelDensity(1);
  frameRate(60);
  textFont("monospace");
  textAlign(CENTER, CENTER);
  noStroke();

  app = new MultiSceneApp(APP_W, APP_H);
}

function draw() {
  app.draw();
}

function mousePressed() {
  return app.mousePressed();
}

function mouseDragged() {
  return app.mouseDragged();
}

function keyPressed() {
  if (key === "f" || key === "F") {
    toggleFullscreenMode();
    return false;
  }

  return app.keyPressed();
}
function windowResized() {
  // 主画布固定为 1080×720，不随窗口 resize 改变，避免场景切换时视觉比例漂移。
}

// ============================================================
// App 总控
// ============================================================
class MultiSceneApp {
  constructor(w, h) {
    this.w = w;
    this.h = h;

    this.backButton = {
      x: w - 118,
      y: 18,
      w: 96,
      h: 36
    };

    this.scenes = {
      home: new HomeScene(this),
      wheat: new WheatScene(this),
      project: new ProjectScene(this),
      screenshot: new ScreenshotScene(this)
    };

    this.currentName = "home";
    this.current = this.scenes.home;
    this.current.onEnter();
  }

  switchTo(name) {
    if (!this.scenes[name] || name === this.currentName) return;
    this.currentName = name;
    this.current = this.scenes[name];
    this.current.onEnter();
  }

  draw() {
    this.current.draw();

    if (this.currentName !== "home") {
      this.drawBackButton();
    }
  }

  mousePressed() {
    if (this.currentName !== "home" && this.isBackHit(mouseX, mouseY)) {
      this.switchTo("home");
      return false;
    }

    if (this.current.mousePressed) {
      return this.current.mousePressed(mouseX, mouseY);
    }
    return false;
  }

  mouseDragged() {
    if (this.currentName !== "home" && this.isBackHit(mouseX, mouseY)) {
      return false;
    }

    if (this.current.mouseDragged) {
      return this.current.mouseDragged(mouseX, mouseY, pmouseX, pmouseY);
    }
    return false;
  }

  keyPressed() {
    if (this.currentName !== "home" && (keyCode === ESCAPE || key === "b" || key === "B")) {
      this.switchTo("home");
      return false;
    }

    if (this.current.keyPressed) {
      return this.current.keyPressed(key, keyCode);
    }
    return false;
  }

  isBackHit(mx, my) {
    const b = this.backButton;
    return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
  }

  drawBackButton() {
    const b = this.backButton;
    const hover = this.isBackHit(mouseX, mouseY);

    push();
    rectMode(CORNER);
    noStroke();
    fill(hover ? 32 : 14, hover ? 34 : 15, hover ? 42 : 20, hover ? 230 : 190);
    rect(b.x, b.y, b.w, b.h, 18);

    stroke(255, hover ? 145 : 86);
    strokeWeight(1);
    noFill();
    rect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1, 18);

    noStroke();
    fill(255, hover ? 245 : 205);
    textFont("monospace");
    textSize(14);
    textAlign(CENTER, CENTER);
    text("BACK", b.x + b.w / 2, b.y + b.h / 2 + 0.5);
    pop();
  }
}

class BaseScene {
  constructor(app) {
    this.app = app;
    this.justEntered = true;
  }

  onEnter() {
    this.justEntered = true;
  }
}

function colorWithAlpha(hexColor, alphaValue) {
  const c = color(hexColor);
  c.setAlpha(alphaValue);
  return c;
}

function fillWithAlpha(hexColor, alphaValue) {
  const c = color(hexColor);
  c.setAlpha(alphaValue);
  fill(c);
}

function strokeWithAlpha(hexColor, alphaValue) {
  const c = color(hexColor);
  c.setAlpha(alphaValue);
  stroke(c);
}

// ============================================================
// 1. 首页：数字雨导航
// ============================================================
class HomeScene extends BaseScene {
  constructor(app) {
    super(app);
    this.navH = 112;
    this.streams = [];
    this.glowPatches = [];
    this.initStreams();
  }

  onEnter() {
    super.onEnter();
    background(0);
  }

  initStreams() {
    this.streams = [];

    for (let i = 0; i < 132; i++) {
      const depth = random();
      const size = lerp(10, 22, pow(depth, 1.3));
      this.streams.push({
        x: random(-20, this.app.w + 20),
        y: random(-this.app.h * 1.4, this.app.h * 0.25),
        speed: lerp(0.25, 1.65, depth),
        size: size,
        gap: size * random(0.88, 1.18),
        len: floor(random(12, 58)),
        alpha: lerp(35, 190, depth),
        seed: random(10000),
        symbolBias: random()
      });
    }

    this.glowPatches = [];
    for (let i = 0; i < 24; i++) {
      this.glowPatches.push({
        x: random(this.app.w),
        y: random(15, this.app.h - this.navH - 20),
        r: random(18, 60),
        a: random(10, 40),
        speed: random(0.12, 0.45)
      });
    }
  }

  draw() {
    background(0);
    this.drawSoftBackground();
    this.updateAndDrawStreams();
    this.drawTopShade();
    this.drawNavigation();
    this.justEntered = false;
  }

  drawSoftBackground() {
    push();
    noStroke();
    fill(255, 8);
    for (const p of this.glowPatches) {
      p.y += p.speed;
      if (p.y > this.app.h - this.navH + p.r) {
        p.y = -p.r;
        p.x = random(this.app.w);
      }
      fill(255, p.a);
      ellipse(p.x, p.y, p.r * 0.72, p.r * 2.1);
    }

    fill(0, 38);
    rect(0, 0, this.app.w, this.app.h - this.navH);
    pop();
  }

  updateAndDrawStreams() {
    push();
    textFont("monospace");
    textAlign(CENTER, CENTER);

    const rainBottom = this.app.h - this.navH + 20;

    for (const s of this.streams) {
      s.y += s.speed;
      const totalLen = s.len * s.gap;
      if (s.y - totalLen > rainBottom) {
        s.y = random(-this.app.h * 0.9, -40);
        s.x = random(-20, this.app.w + 20);
        s.len = floor(random(12, 58));
      }

      textSize(s.size);
      for (let i = 0; i < s.len; i++) {
        const yy = s.y - i * s.gap;
        if (yy < -40 || yy > rainBottom) continue;

        const t = i / max(1, s.len - 1);
        const wave = noise(s.seed, i * 0.17, frameCount * 0.011);
        const alpha = s.alpha * pow(1 - t, 0.65) * lerp(0.45, 1.25, wave);
        const xx = s.x + (noise(s.seed + i * 1.7, frameCount * 0.006) - 0.5) * 9;
        const ch = this.pickBinarySymbol(s.seed + i * 8.13 + floor(frameCount * 0.035));

        if (wave > 0.78 && i < 10) {
          fill(255, min(90, alpha * 0.58));
          textSize(s.size * 1.5);
          text(ch, xx, yy);
          textSize(s.size);
        }

        fill(230, alpha);
        text(ch, xx, yy);
      }
    }
    pop();
  }

  pickBinarySymbol(v) {
    const n = noise(v * 0.03, frameCount * 0.012);
    if (n < 0.43) return "0";
    if (n < 0.86) return "1";
    return "Ø";
  }

  drawTopShade() {
    push();
    noStroke();
    for (let i = 0; i < 80; i++) {
      fill(0, map(i, 0, 79, 80, 0));
      rect(0, i * 2, this.app.w, 2);
    }
    pop();
  }

  drawNavigation() {
    const y = this.app.h - this.navH;
    const labels = ["Chat History", "Project Files", "Screenshot"];
    const targets = ["wheat", "project", "screenshot"];

    push();
    noStroke();
    fill(9, 10, 16, 245);
    rect(0, y, this.app.w, this.navH);

    fill(255, 8);
    rect(0, y, this.app.w, 1);

    textFont("Arial");
    textAlign(CENTER, CENTER);

    for (let i = 0; i < 3; i++) {
      const x0 = (this.app.w / 3) * i;
      const cx = x0 + this.app.w / 6;
      const hover = mouseY >= y && mouseX >= x0 && mouseX < x0 + this.app.w / 3;

      if (hover) {
        fill(255, 13);
        rect(x0, y, this.app.w / 3, this.navH);
      }

      fill(hover ? 255 : 242, hover ? 255 : 245, hover ? 255 : 248, hover ? 255 : 238);
      textSize(30);
      text(labels[i], cx, y + 58);

      fill(255, hover ? 115 : 35);
      textFont("monospace");
      textSize(11);
      text(targets[i].toUpperCase(), cx, y + 86);
      textFont("Arial");
    }

    pop();
  }

  mousePressed(mx, my) {
    const y = this.app.h - this.navH;
    if (my >= y) {
      if (mx < this.app.w / 3) this.app.switchTo("wheat");
      else if (mx < (this.app.w / 3) * 2) this.app.switchTo("project");
      else this.app.switchTo("screenshot");
    }
    return false;
  }
}

// ============================================================
// 2. Chat History：麦田拖拽割麦（1080×720 铺满版）
// ============================================================
class WheatScene extends BaseScene {
  constructor(app) {
    super(app);

    this.W = this.app.w;
    this.H = this.app.h;

    this.C = {
      COLOR_BG: "#000000",
      COLOR_GRID_1: "#A09C91",
      COLOR_GRID_2: "#C6BFAC",
      COLOR_GRID_3: "#DACDA5",
      COLOR_WHEAT_LOW: "#B2A684",
      COLOR_WHEAT_MID: "#D7C387",
      COLOR_WHEAT_TOP: "#FFF29E",
      COLOR_STEM: "#A59876",
      COLOR_STEM_BRIGHT: "#DCBC84",
      COLOR_FALLEN: "#8C8574",
      COLOR_CUT_EAR: "#9B8E68",
      COLOR_CUT_EAR_DARK: "#6F6756",
      COLOR_UI: "#6E685C",
      COLOR_CUT_LINE: "#F5F5F5",

      LETTERS: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",

      HORIZON_Y: 90,
      FIELD_BOTTOM: 700,
      FIELD_ROWS: 34,
      GRID_MIN_W: 210,
      GRID_MAX_W: 1040,
      GRID_MIN_SIZE: 9,
      GRID_MAX_SIZE: 18,

      MAX_STALKS: 220,
      INITIAL_STALKS: 170,
      SPAWN_INTERVAL: 5,
      SPAWN_EACH_TIME: 12,

      EAR_MIN_SEGMENTS: 5,
      EAR_MAX_SEGMENTS: 11,
      GROW_MIN_DURATION: 50,
      GROW_MAX_DURATION: 120,

      SWAY_AMP: 7,
      SWAY_SPEED_MIN: 0.012,
      SWAY_SPEED_MAX: 0.038,

      STEM_STYLE: "blocks",
      STEM_MIN_LEN: 34,
      STEM_MAX_LEN: 125,
      STEM_WEIGHT_MIN: 0.3,
      STEM_WEIGHT_MAX: 0.9,
      STEM_BLOCK_STEP: 5,

      AVOID_SAME_SLOT: false,
      FAR_ROW_SKIP_T: 0.22,
      FAR_ROW_SKIP_CHANCE: 0.65,
      SPAWN_TRY_LIMIT: 180,
      USE_SOFT_DISTANCE_CHECK: true,
      MIN_STALK_DIST_NEAR: 7,
      MIN_STALK_DIST_FAR: 4,

      CUT_RADIUS: 28,
      CUT_MIN_PROGRESS: 0.98,
      CUT_MAX_PER_FRAME: 8,
      CUT_MARK_FADE_SPEED: 13,
      CUT_STEM_FADE_SPEED: 1.2,

      FALL_GRAVITY: 0.13,
      FALL_FADE_DELAY: 10,
      FALL_FADE_SPEED: 3.0,

      HEAP_LAYER_COUNT: 6,
      HEAP_LAYER_STEP: 6.5,
      HEAP_WIDTH_BOTTOM: 34,
      HEAP_WIDTH_TOP: 8,
      HEAP_SETTLE_JITTER: 1.4
    };

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.initAll();
  }

  onEnter() {
    super.onEnter();
    background(0);
  }

  initAll() {
    this.fieldPoints = [];
    this.stalks = [];
    this.fallenEars = [];
    this.cutStems = [];
    this.cutMarks = [];
    this.lastSpawnFrame = 0;
    this.createPerspectiveField();
    this.spawnBatch(this.C.INITIAL_STALKS);
  }

  updateTransform() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  toLocal(mx, my) {
    return {
      x: mx,
      y: my
    };
  }

  containsLocal(p) {
    return p.x >= 0 && p.x <= this.W && p.y >= 0 && p.y <= this.H;
  }

  draw() {
    background(this.C.COLOR_BG);
    this.updateTransform();
    this.drawLocalScene();
    this.justEntered = false;
  }

  drawLocalScene() {
    noStroke();
    fill(this.C.COLOR_BG);
    rect(0, 0, this.W, this.H);

    textFont("monospace");
    textAlign(CENTER, CENTER);
    noStroke();

    this.drawBaseLetterField();
    this.updateAutoGrowth();

    this.updateCutStems();

    for (const s of this.stalks) {
      s.update();
      s.display();
    }

    this.updateFallenEars();
    this.updateCutMarks();
    this.drawMouseCutter();
    this.drawHint();
  }

  mousePressed(mx, my) {
    const p = this.toLocal(mx, my);
    if (!this.containsLocal(p)) return false;

    this.tryCutByMouse(p.x, p.y, p.x + 0.1, p.y + 0.1);
    this.addCutMark(p.x - 7, p.y - 4, p.x + 7, p.y + 4);
    return false;
  }

  mouseDragged(mx, my, pmx, pmy) {
    const p = this.toLocal(mx, my);
    const pp = this.toLocal(pmx, pmy);
    if (!this.containsLocal(p) && !this.containsLocal(pp)) return false;

    this.tryCutByMouse(pp.x, pp.y, p.x, p.y);
    this.addCutMark(pp.x, pp.y, p.x, p.y);
    return false;
  }

  keyPressed(k) {
    if (k === "r" || k === "R") {
      this.initAll();
      return false;
    }
    return false;
  }

  createPerspectiveField() {
    this.fieldPoints = [];
    let pointId = 0;
    const C = this.C;

    for (let r = 0; r < C.FIELD_ROWS; r++) {
      const t = r / (C.FIELD_ROWS - 1);
      const yBase = C.HORIZON_Y + pow(t, 1.75) * (C.FIELD_BOTTOM - C.HORIZON_Y);
      const rowW = lerp(C.GRID_MIN_W, C.GRID_MAX_W, pow(t, 0.72));
      const count = floor(lerp(13, 56, t));
      const scaleV = lerp(0.48, 1.18, t);
      const startX = this.W / 2 - rowW / 2;

      for (let i = 0; i < count; i++) {
        let x = startX + (i + 0.5) * (rowW / count);
        let y = yBase;

        x += random(-5, 5) * scaleV;
        y += random(-2, 2) * scaleV;

        this.fieldPoints.push({
          id: pointId,
          rowIndex: r,
          colIndex: i,
          x: x,
          y: y,
          scale: scaleV,
          rowT: t,
          letter: this.randomLetter(),
          flashSeed: random(1000)
        });

        pointId++;
      }
    }
  }

  drawBaseLetterField() {
    const C = this.C;

    for (const p of this.fieldPoints) {
      const flash = noise(p.flashSeed, frameCount * 0.035);
      const baseColHex = this.randomBaseColor(p.flashSeed);
      const baseCol = color(baseColHex);
      const alpha = map(p.rowT, 0, 1, 38, 78);

      if (flash > 0.78) {
        const glow = map(flash, 0.78, 1, 0, 1);
        const topCol = color(C.COLOR_WHEAT_TOP);

        fill(
          lerp(red(baseCol), red(topCol), glow),
          lerp(green(baseCol), green(topCol), glow),
          lerp(blue(baseCol), blue(topCol), glow),
          alpha + glow * 90
        );
      } else {
        baseCol.setAlpha(alpha);
        fill(baseCol);
      }

      textSize(lerp(C.GRID_MIN_SIZE, C.GRID_MAX_SIZE, p.rowT));
      text(p.letter, p.x, p.y);
    }
  }

  randomBaseColor(seed) {
    const v = noise(seed * 0.1);
    if (v < 0.33) return this.C.COLOR_GRID_1;
    if (v < 0.66) return this.C.COLOR_GRID_2;
    return this.C.COLOR_GRID_3;
  }

  updateAutoGrowth() {
    const C = this.C;

    if (frameCount - this.lastSpawnFrame > C.SPAWN_INTERVAL && this.stalks.length < C.MAX_STALKS) {
      this.spawnBatch(C.SPAWN_EACH_TIME);
      this.lastSpawnFrame = frameCount;
    }
  }

  spawnBatch(num) {
    for (let i = 0; i < num; i++) {
      if (this.stalks.length >= this.C.MAX_STALKS) return;

      const p = this.pickOriginalDistributionPoint();
      if (!p) return;

      this.stalks.push(new WheatStalk(this, p));
    }
  }

  pickOriginalDistributionPoint() {
    const C = this.C;
    const occupied = new Set();

    for (const s of this.stalks) {
      if (s.slotId !== undefined && s.slotId !== null) {
        occupied.add(s.slotId);
      }
    }

    for (let tries = 0; tries < C.SPAWN_TRY_LIMIT; tries++) {
      const p = random(this.fieldPoints);

      if (C.AVOID_SAME_SLOT && occupied.has(p.id)) continue;
      if (p.rowT < C.FAR_ROW_SKIP_T && random() < C.FAR_ROW_SKIP_CHANCE) continue;
      if (C.USE_SOFT_DISTANCE_CHECK && this.isTooCloseToExistingStalk(p)) continue;

      return p;
    }

    for (let tries = 0; tries < C.SPAWN_TRY_LIMIT; tries++) {
      const p = random(this.fieldPoints);

      if (C.AVOID_SAME_SLOT && occupied.has(p.id)) continue;
      if (p.rowT < C.FAR_ROW_SKIP_T && random() < C.FAR_ROW_SKIP_CHANCE) continue;

      return p;
    }

    return null;
  }

  isTooCloseToExistingStalk(p) {
    const minDist = lerp(this.C.MIN_STALK_DIST_FAR, this.C.MIN_STALK_DIST_NEAR, p.rowT) * p.scale;

    for (const s of this.stalks) {
      if (abs(s.rowT - p.rowT) > 0.08) continue;
      if (dist(s.baseX, s.baseY, p.x, p.y) < minDist) return true;
    }

    return false;
  }

  updateCutStems() {
    for (const cs of this.cutStems) {
      cs.update();
      cs.display();
    }

    this.cutStems = this.cutStems.filter(cs => !cs.dead);
  }

  updateFallenEars() {
    for (const e of this.fallenEars) {
      e.update();
      e.display();
    }

    this.fallenEars = this.fallenEars.filter(e => !e.dead);
  }

  tryCutByMouse(x1, y1, x2, y2) {
    let cutCount = 0;

    for (let i = this.stalks.length - 1; i >= 0; i--) {
      const s = this.stalks[i];

      if (!s.isRipe()) continue;
      if (!s.isHitBySegment(x1, y1, x2, y2, this.C.CUT_RADIUS)) continue;

      this.fallenEars.push(s.exportFallenEar((x1 + x2) * 0.5, (y1 + y2) * 0.5));
      this.cutStems.push(new WheatCutStem(this, s));
      this.stalks.splice(i, 1);

      cutCount++;
      if (cutCount >= this.C.CUT_MAX_PER_FRAME) break;
    }
  }

  addCutMark(x1, y1, x2, y2) {
    const d = dist(x1, y1, x2, y2);
    if (d < 1) return;

    this.cutMarks.push({
      x1,
      y1,
      x2,
      y2,
      alpha: 150,
      weight: random(0.7, 1.4)
    });
  }

  updateCutMarks() {
    push();
    noFill();

    for (const m of this.cutMarks) {
      m.alpha -= this.C.CUT_MARK_FADE_SPEED;
      strokeWithAlpha(this.C.COLOR_CUT_LINE, m.alpha);
      strokeWeight(m.weight);
      line(m.x1, m.y1, m.x2, m.y2);
    }

    pop();

    this.cutMarks = this.cutMarks.filter(m => m.alpha > 0);
  }

  drawMouseCutter() {
    const p = this.toLocal(mouseX, mouseY);
    if (!this.containsLocal(p)) return;

    push();
    noFill();

    strokeWithAlpha(this.C.COLOR_UI, mouseIsPressed ? 78 : 32);
    strokeWeight(0.8);
    ellipse(p.x, p.y, this.C.CUT_RADIUS * 2, this.C.CUT_RADIUS * 2);

    if (mouseIsPressed) {
      strokeWithAlpha(this.C.COLOR_CUT_LINE, 135);
      strokeWeight(1.2);
      line(p.x - 9, p.y + 5, p.x + 9, p.y - 5);
    }

    pop();
  }

  drawHint() {
    push();
    textAlign(LEFT, CENTER);
    textSize(11);

    let ripeCount = 0;
    for (const s of this.stalks) {
      if (s.isRipe()) ripeCount++;
    }

    const msg = mouseIsPressed ? "cutting ripe wheat..." : "drag mouse over ripe wheat to harvest";
    const uiC = color(this.C.COLOR_UI);
    uiC.setAlpha(120);

    fill(uiC);
    text(msg, 18, 26);
    text(`ripe: ${ripeCount}`, 18, 43);

    pop();
  }

  randomLetter() {
    return this.C.LETTERS.charAt(floor(random(this.C.LETTERS.length)));
  }

  distPointToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;

    if (lenSq <= 0.0001) return dist(px, py, x1, y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = constrain(t, 0, 1);

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return dist(px, py, projX, projY);
  }
}

class WheatStalk {
  constructor(scene, point) {
    this.scene = scene;
    const C = scene.C;

    this.slotId = point.id;
    this.baseX = point.x;
    this.baseY = point.y;
    this.scale = point.scale;
    this.rowT = point.rowT;

    this.earCount = floor(lerp(C.EAR_MIN_SEGMENTS, C.EAR_MAX_SEGMENTS, this.rowT) + random(-1, 2));
    this.earCount = constrain(this.earCount, C.EAR_MIN_SEGMENTS, C.EAR_MAX_SEGMENTS);

    this.earSpacing = lerp(5, 8, this.rowT) * this.scale;
    this.stemLength = lerp(C.STEM_MIN_LEN, C.STEM_MAX_LEN, this.rowT) * this.scale * random(0.9, 1.15);

    this.age = 0;
    this.growDuration = random(C.GROW_MIN_DURATION, C.GROW_MAX_DURATION);

    this.noiseSeed = random(1000);
    this.swaySpeed = random(C.SWAY_SPEED_MIN, C.SWAY_SPEED_MAX);
    this.swayAmp = C.SWAY_AMP * this.scale * random(0.7, 1.25);

    this.totalHeight = this.stemLength + this.earCount * this.earSpacing;

    this.letters = [];
    this.earOffsets = [];

    for (let i = 0; i < this.earCount; i++) {
      this.letters.push(scene.randomLetter());

      const level = i / max(1, this.earCount - 1);
      let side = i % 2 === 0 ? -1 : 1;
      const spread = lerp(5.2, 1.6, level) * this.scale * random(0.8, 1.12);

      if (random() < 0.22) side *= 0.4;
      this.earOffsets.push(side * spread);
    }
  }

  update() {
    this.age++;
  }

  get progress() {
    return constrain(this.age / this.growDuration, 0, 1);
  }

  isRipe() {
    return this.progress >= this.scene.C.CUT_MIN_PROGRESS;
  }

  display() {
    this.drawStem();

    const C = this.scene.C;
    const positions = this.getVisibleLetterPositions();

    for (const p of positions) {
      const level = p.index / max(1, this.earCount - 1);

      let colHex;
      if (level > 0.68) colHex = C.COLOR_WHEAT_TOP;
      else if (level > 0.35) colHex = C.COLOR_WHEAT_MID;
      else colHex = C.COLOR_WHEAT_LOW;

      const col = color(colHex);
      let alpha = lerp(65, 210, level) * p.appearAlpha;

      if (this.isRipe() && level > 0.55) {
        alpha += 25 * sin(frameCount * 0.05 + this.noiseSeed);
      }

      col.setAlpha(alpha);
      fill(col);
      textSize(p.size);
      text(p.char, p.x, p.y);
    }
  }

  drawStem() {
    const visibleHeight = min(this.progress * this.totalHeight, this.stemLength);
    if (visibleHeight <= 0) return;

    if (this.scene.C.STEM_STYLE === "line") {
      this.drawStemLine(visibleHeight, 180);
    } else if (this.scene.C.STEM_STYLE === "letters") {
      this.drawStemLetters(visibleHeight, 165);
    } else {
      this.drawStemBlocks(visibleHeight, 165);
    }
  }

  drawStemLine(visibleHeight, alphaValue) {
    const C = this.scene.C;
    const endT = visibleHeight / this.stemLength;
    const steps = 10;

    push();
    noFill();

    const stemC = color(C.COLOR_STEM);
    const brightC = color(C.COLOR_STEM_BRIGHT);

    stroke(
      lerp(red(stemC), red(brightC), 0.35),
      lerp(green(stemC), green(brightC), 0.35),
      lerp(blue(stemC), blue(brightC), 0.35),
      alphaValue
    );

    strokeWeight(lerp(C.STEM_WEIGHT_MIN, C.STEM_WEIGHT_MAX, this.rowT) * this.scale);

    beginShape();

    for (let i = 0; i <= steps; i++) {
      const t = endT * (i / steps);
      const p = this.getStemPointAt(t);
      vertex(p.x, p.y);
    }

    endShape();
    pop();
  }

  drawStemLetters(visibleHeight, alphaValue) {
    const C = this.scene.C;
    const steps = max(1, floor(visibleHeight / (C.STEM_BLOCK_STEP * this.scale)));

    push();

    const c = color(C.COLOR_STEM_BRIGHT);
    c.setAlpha(alphaValue);

    fill(c);
    textSize(lerp(6, 9, this.rowT));

    for (let i = 0; i <= steps; i++) {
      const t = map(i, 0, steps, 0, visibleHeight / this.stemLength);
      const p = this.getStemPointAt(t);
      text("I", p.x, p.y);
    }

    pop();
  }

  drawStemBlocks(visibleHeight, alphaValue) {
    const C = this.scene.C;
    const steps = max(1, floor(visibleHeight / (C.STEM_BLOCK_STEP * this.scale)));
    const blockSize = lerp(1.8, 3.5, this.rowT) * this.scale;

    push();
    noStroke();
    rectMode(CENTER);

    for (let i = 0; i <= steps; i++) {
      const t = map(i, 0, steps, 0, visibleHeight / this.stemLength);
      const p = this.getStemPointAt(t);
      const glow = map(i, 0, steps, 0.15, 0.75);

      const baseC = color(C.COLOR_STEM);
      const brightC = color(C.COLOR_STEM_BRIGHT);

      fill(
        lerp(red(baseC), red(brightC), glow),
        lerp(green(baseC), green(brightC), glow),
        lerp(blue(baseC), blue(brightC), glow),
        alphaValue
      );

      rect(p.x, p.y, blockSize, blockSize);
    }

    pop();
  }

  getStemPointAt(t) {
    t = constrain(t, 0, 1);

    const sway =
      sin(frameCount * this.swaySpeed + this.noiseSeed + t * 1.8) *
      this.swayAmp *
      0.42 *
      (0.25 + t);

    const noiseSway =
      (noise(this.noiseSeed + t * 2.3, frameCount * 0.01) - 0.5) *
      this.swayAmp *
      0.55 *
      t;

    return {
      x: this.baseX + sway + noiseSway,
      y: this.baseY - t * this.stemLength
    };
  }

  getVisibleLetterPositions() {
    const arr = [];

    const grownHeight = this.progress * this.totalHeight;
    const earVisibleHeight = max(0, grownHeight - this.stemLength);
    const growFront = earVisibleHeight / this.earSpacing;
    const stemTop = this.getStemPointAt(1);

    for (let i = 0; i < this.earCount; i++) {
      if (i > growFront + 0.2) continue;

      const level = i / max(1, this.earCount - 1);

      const microSway =
        sin(frameCount * this.swaySpeed + this.noiseSeed + i * 0.35) *
        this.swayAmp *
        0.16 *
        (1 - level);

      const x = stemTop.x + this.earOffsets[i] + microSway;
      const y = stemTop.y - i * this.earSpacing;

      const appearAlpha = constrain(growFront - i + 0.45, 0, 1);
      const size = lerp(10, 16, this.rowT) * lerp(0.9, 1.15, level);

      arr.push({
        x,
        y,
        char: this.letters[i],
        index: i,
        size,
        appearAlpha,
        level
      });
    }

    return arr;
  }

  isHitBySegment(x1, y1, x2, y2, radius) {
    const positions = this.getVisibleLetterPositions();
    if (positions.length < this.earCount - 1) return false;

    for (const p of positions) {
      const d = this.scene.distPointToSegment(p.x, p.y, x1, y1, x2, y2);
      if (d <= radius * this.scale + p.size * 0.45) return true;
    }

    return false;
  }

  exportFallenEar(cutX, cutY) {
    const positions = this.getVisibleLetterPositions();
    return new WheatFallenEar(this.scene, this, positions, cutX, cutY);
  }
}

class WheatCutStem {
  constructor(scene, stalk) {
    this.scene = scene;
    this.baseX = stalk.baseX;
    this.baseY = stalk.baseY;
    this.scale = stalk.scale;
    this.rowT = stalk.rowT;
    this.stemLength = stalk.stemLength;
    this.noiseSeed = stalk.noiseSeed;
    this.swaySpeed = stalk.swaySpeed;
    this.swayAmp = stalk.swayAmp;
    this.alpha = 115;
    this.dead = false;
  }

  update() {
    this.alpha -= this.scene.C.CUT_STEM_FADE_SPEED;
    if (this.alpha <= 0) this.dead = true;
  }

  display() {
    const C = this.scene.C;
    const visibleHeight = this.stemLength * 0.92;

    push();
    rectMode(CENTER);
    noStroke();

    const steps = max(1, floor(visibleHeight / (C.STEM_BLOCK_STEP * this.scale)));
    const blockSize = lerp(1.6, 3.1, this.rowT) * this.scale;

    for (let i = 0; i <= steps; i++) {
      const t = map(i, 0, steps, 0, visibleHeight / this.stemLength);
      const p = this.getStemPointAt(t);
      const baseC = color(C.COLOR_STEM);

      baseC.setAlpha(this.alpha * map(i, 0, steps, 0.45, 1));
      fill(baseC);
      rect(p.x, p.y, blockSize, blockSize);
    }

    pop();
  }

  getStemPointAt(t) {
    t = constrain(t, 0, 1);

    const sway =
      sin(frameCount * this.swaySpeed + this.noiseSeed + t * 1.8) *
      this.swayAmp *
      0.35 *
      (0.25 + t);

    const noiseSway =
      (noise(this.noiseSeed + t * 2.3, frameCount * 0.01) - 0.5) *
      this.swayAmp *
      0.45 *
      t;

    return {
      x: this.baseX + sway + noiseSway,
      y: this.baseY - t * this.stemLength
    };
  }
}

class WheatFallenEar {
  constructor(scene, stalk, positions, cutX, cutY) {
    this.scene = scene;
    this.parts = [];
    this.dead = false;

    const C = scene.C;
    const heapCenterX = stalk.baseX + random(-8, 8) * stalk.scale;
    const heapBaseY = stalk.baseY + random(-2, 7) * stalk.scale;

    for (const p of positions) {
      const layer = floor(random(0, C.HEAP_LAYER_COUNT));
      const layerT = layer / max(1, C.HEAP_LAYER_COUNT - 1);
      const layerWidth = lerp(C.HEAP_WIDTH_BOTTOM, C.HEAP_WIDTH_TOP, layerT) * stalk.scale;

      const targetX = heapCenterX + random(-layerWidth, layerWidth);
      const targetY =
        heapBaseY -
        layer * C.HEAP_LAYER_STEP * stalk.scale +
        random(-C.HEAP_SETTLE_JITTER, C.HEAP_SETTLE_JITTER) * stalk.scale;

      const cutPushX = (p.x - cutX) * 0.01;
      const cutPushY = (p.y - cutY) * 0.006;

      this.parts.push(
        new WheatFallenLetter(
          scene,
          p.x,
          p.y,
          targetX,
          targetY,
          p.char,
          p.size,
          p.level,
          stalk.scale,
          cutPushX,
          cutPushY
        )
      );
    }
  }

  update() {
    for (const p of this.parts) {
      p.update();
    }

    this.parts = this.parts.filter(p => !p.dead);
    if (this.parts.length === 0) this.dead = true;
  }

  display() {
    for (const p of this.parts) {
      p.display();
    }
  }
}

class WheatFallenLetter {
  constructor(scene, x, y, tx, ty, char, size, level, scaleV, cutPushX, cutPushY) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.targetX = tx;
    this.targetY = ty;
    this.char = char;
    this.size = size * random(0.82, 1.05);
    this.level = level;
    this.scale = scaleV;

    this.vx = random(-0.6, 0.6) * scaleV + cutPushX;
    this.vy = random(1.1, 2.9) * scaleV + cutPushY;

    this.rot = random(-0.5, 0.5);
    this.rotSpeed = random(-0.045, 0.045);

    this.alpha = 230;
    this.landed = false;
    this.landAge = 0;
    this.dead = false;

    this.cutColorMix = random(0.72, 1.0);
  }

  update() {
    const C = this.scene.C;

    if (!this.landed) {
      this.vy += C.FALL_GRAVITY;
      this.x += this.vx;
      this.y += this.vy;
      this.x = lerp(this.x, this.targetX, 0.035);
      this.rot += this.rotSpeed;

      if (this.y >= this.targetY) {
        this.y = this.targetY;
        this.x = this.targetX + random(-0.8, 0.8) * this.scale;
        this.vx = 0;
        this.vy = 0;
        this.rotSpeed *= 0.12;
        this.landed = true;
      }
    } else {
      this.landAge++;
      this.rot = lerp(this.rot, random(-0.08, 0.08), 0.012);

      if (this.landAge > C.FALL_FADE_DELAY) {
        this.alpha -= C.FALL_FADE_SPEED;
      }

      if (this.alpha <= 0) {
        this.dead = true;
      }
    }
  }

  display() {
    const C = this.scene.C;

    push();
    translate(this.x, this.y);
    rotate(this.rot);

    const activeC = color(C.COLOR_WHEAT_TOP);
    const cutC = color(C.COLOR_CUT_EAR);
    const darkC = color(C.COLOR_CUT_EAR_DARK);
    const landMix = this.landed ? constrain(this.landAge / 45, 0, 1) : 0;

    const midR = lerp(red(activeC), red(cutC), this.cutColorMix);
    const midG = lerp(green(activeC), green(cutC), this.cutColorMix);
    const midB = lerp(blue(activeC), blue(cutC), this.cutColorMix);

    const r = lerp(midR, red(darkC), landMix * 0.75);
    const g = lerp(midG, green(darkC), landMix * 0.75);
    const b = lerp(midB, blue(darkC), landMix * 0.75);

    fill(r, g, b, this.alpha * lerp(0.72, 1.0, this.level));
    textSize(this.size);
    text(this.char, 0, 0);

    pop();
  }
}
// ============================================================
// 3. Project Files：PROJECT 流水堆积 / 鼠标擦除
// ============================================================
class ProjectScene extends BaseScene {
  constructor(app) {
    super(app);
    this.C = {
      COLOR_BG: "#000000",
      LETTER_COLOR: "#abcbd3",
      LETTER_COLOR_DIM: "#ffffff",
      SETTLED_COLOR: "#acbac9",
      UI_COLOR: "#E6E6E6",
      ERASE_MARK_COLOR: "#000000",
      ERASE_RING_COLOR: "#FFFFFF",
      BG_FADE: 50,
      FALL_WORD: "PROJECT",
      SPAWN_PER_FRAME: 1,
      MAX_ACTIVE: 200,
      MAX_SETTLED: 500,
      NOISE_SCALE_X: 1 / 520,
      NOISE_SCALE_Y: 1 / 11,
      NOISE_SCALE_T: 1 / 260,
      STRAIGHT_FALL_THRESHOLD: 0.4,
      SIDE_STEP: 1.15,
      SLOW_FALL: 0.55,
      FALL_ACCEL: 0.42,
      LETTER_SIZE_MIN: 10,
      LETTER_SIZE_MAX: 16,
      LETTER_SHRINK: 0.998,
      PILE_BOTTOM_MARGIN: 18,
      PILE_CELL_W: 12,
      PILE_ROW_H: 12,
      SETTLE_LERP_X: 0.22,
      SETTLE_LERP_Y: 0.16,
      SETTLE_THRESHOLD: 1.2,
      MOUSE_ERASE_RADIUS: 58,
      MOUSE_ERASE_STRENGTH: 0.72,
      MOUSE_ERASE_INTERVAL: 4,
      MOUSE_ERASE_MIN_KEEP: 18,
      MOUSE_ERASE_ACTIVE_TOO: false,
      ERASE_MARK_LIFE: 22,
      ERASE_MARK_GROW: 0.9
    };

    this.initAll();
  }

  onEnter() {
    super.onEnter();
    background(0);
  }

  initAll() {
    this.activeLetters = [];
    this.settledLetters = [];
    this.pileHeights = new Array(floor(this.app.w / this.C.PILE_CELL_W)).fill(0);
    this.timeFlow = 0;
    this.paused = false;
    this.wordIndex = 0;
    this.eraseMarks = [];
    this.lastErasedCount = 0;
    this.createPileLayer();
  }

  createPileLayer() {
    this.pileLayer = createGraphics(this.app.w, this.app.h);
    this.pileLayer.pixelDensity(1);
    this.pileLayer.textAlign(CENTER, CENTER);
    this.pileLayer.textFont("monospace");
    this.pileLayer.noStroke();
    this.pileLayer.clear();
  }

  draw() {
    if (this.justEntered) {
      background(this.C.COLOR_BG);
    } else {
      background(colorWithAlpha(this.C.COLOR_BG, this.C.BG_FADE));
    }

    textFont("monospace");
    textAlign(CENTER, CENTER);
    noStroke();

    if (!this.paused) {
      this.spawnLetters();
      this.updateActiveLetters();
      this.timeFlow++;
    }

    if (!this.paused && mouseIsPressed && !this.app.isBackHit(mouseX, mouseY)) {
      if (frameCount % this.C.MOUSE_ERASE_INTERVAL === 0) {
        this.eraseSettledByMouse(mouseX, mouseY);
      }
    }

    image(this.pileLayer, 0, 0);
    this.updateAndDrawEraseMarks();
    this.drawActiveLetters();
    this.drawMouseEraseCursor();
    this.drawUI();
    this.justEntered = false;
  }

  mousePressed(mx, my) {
    if (!this.paused) this.eraseSettledByMouse(mx, my);
    return false;
  }

  keyPressed(k) {
    if (k === "r" || k === "R") {
      this.initAll();
      background(0);
      return false;
    }
    if (k === " ") {
      this.paused = !this.paused;
      return false;
    }
    return false;
  }

  spawnLetters() {
    const C = this.C;
    if (this.activeLetters.length > C.MAX_ACTIVE) return;
    for (let i = 0; i < C.SPAWN_PER_FRAME; i++) {
      const px = (this.timeFlow * 99 + i * 83) % this.app.w;
      this.activeLetters.push(new FlowLetter(this, px, random(-20, 0), this.nextProjectLetter(), random(C.LETTER_SIZE_MIN, C.LETTER_SIZE_MAX)));
    }
  }

  nextProjectLetter() {
    const ch = this.C.FALL_WORD.charAt(this.wordIndex % this.C.FALL_WORD.length);
    this.wordIndex++;
    return ch;
  }

  updateActiveLetters() {
    for (let i = this.activeLetters.length - 1; i >= 0; i--) {
      const l = this.activeLetters[i];
      l.update();
      if (l.state === "settled") {
        this.addSettledLetter(l);
        this.activeLetters.splice(i, 1);
      }
    }

    if (this.settledLetters.length > this.C.MAX_SETTLED) {
      const overflow = this.settledLetters.length - this.C.MAX_SETTLED;
      this.settledLetters.splice(0, overflow);
      this.rebuildPileFromSettled();
    }
  }

  addSettledLetter(l) {
    const record = {
      x: l.x,
      y: l.y,
      ch: l.ch,
      size: l.size,
      col: l.pileCol,
      layer: l.pileLayerIndex,
      rot: random(-0.08, 0.08)
    };
    this.settledLetters.push(record);
    this.drawLetterToPileLayer(record);
  }

  drawLetterToPileLayer(record) {
    this.pileLayer.push();
    this.pileLayer.translate(record.x, record.y);
    this.pileLayer.rotate(record.rot);
    this.pileLayer.fill(this.C.SETTLED_COLOR);
    this.pileLayer.textSize(record.size * 0.92);
    this.pileLayer.text(record.ch, 0, 0);
    this.pileLayer.pop();
  }

  eraseSettledByMouse(mx, my) {
    const C = this.C;
    if (this.settledLetters.length <= C.MOUSE_ERASE_MIN_KEEP) {
      this.addEraseMark(mx, my, 0);
      return;
    }

    const maxCanErase = this.settledLetters.length - C.MOUSE_ERASE_MIN_KEEP;
    const remaining = [];
    let erased = 0;

    for (let i = 0; i < this.settledLetters.length; i++) {
      const r = this.settledLetters[i];
      const d = dist(mx, my, r.x, r.y);
      if (d < C.MOUSE_ERASE_RADIUS && erased < maxCanErase) {
        const closeness = 1.0 - d / C.MOUSE_ERASE_RADIUS;
        let eraseChance = closeness * C.MOUSE_ERASE_STRENGTH;
        eraseChance *= random(0.65, 1.25);
        if (random() < eraseChance) erased++;
        else remaining.push(r);
      } else {
        remaining.push(r);
      }
    }

    this.settledLetters = remaining;
    if (erased > 0) {
      this.lastErasedCount = erased;
      this.rebuildPileFromSettled();
    }
    this.addEraseMark(mx, my, erased);

    if (C.MOUSE_ERASE_ACTIVE_TOO) this.eraseActiveLettersByMouse(mx, my);
  }

  eraseActiveLettersByMouse(mx, my) {
    for (let i = this.activeLetters.length - 1; i >= 0; i--) {
      const l = this.activeLetters[i];
      const d = dist(mx, my, l.x, l.y);
      if (d < this.C.MOUSE_ERASE_RADIUS * 0.75 && random() < 0.5) {
        this.activeLetters.splice(i, 1);
      }
    }
  }

  addEraseMark(mx, my, erasedCount) {
    this.eraseMarks.push({
      x: mx,
      y: my,
      r: this.C.MOUSE_ERASE_RADIUS * random(0.62, 0.92),
      life: this.C.ERASE_MARK_LIFE,
      maxLife: this.C.ERASE_MARK_LIFE,
      erasedCount: erasedCount
    });

    if (this.eraseMarks.length > 24) this.eraseMarks.shift();
  }

  rebuildPileFromSettled() {
    this.pileLayer.clear();
    this.pileHeights = new Array(floor(this.app.w / this.C.PILE_CELL_W)).fill(0);

    for (const record of this.settledLetters) {
      let col = record.col;
      if (col === undefined) col = floor(record.x / this.C.PILE_CELL_W);
      col = constrain(col, 0, this.pileHeights.length - 1);

      let layerIndex = record.layer;
      if (layerIndex === undefined) {
        layerIndex = floor((this.app.h - this.C.PILE_BOTTOM_MARGIN - record.y) / this.C.PILE_ROW_H);
      }
      this.pileHeights[col] = max(this.pileHeights[col], layerIndex + 1);
      this.drawLetterToPileLayer(record);
    }
  }

  drawActiveLetters() {
    for (const l of this.activeLetters) l.display();
  }

  updateAndDrawEraseMarks() {
    for (let i = this.eraseMarks.length - 1; i >= 0; i--) {
      const m = this.eraseMarks[i];
      const t = m.life / m.maxLife;
      const alpha = map(t, 0, 1, 0, 190);
      const rr = m.r + (1 - t) * m.r * this.C.ERASE_MARK_GROW;

      noStroke();
      fill(colorWithAlpha(this.C.ERASE_MARK_COLOR, alpha));
      ellipse(m.x, m.y, rr * 2, rr * 2);

      for (let k = 0; k < 3; k++) {
        const a = random(TWO_PI);
        const d = random(rr * 0.35, rr * 0.95);
        const px = m.x + cos(a) * d;
        const py = m.y + sin(a) * d;
        const pr = random(2, 7);
        fill(colorWithAlpha(this.C.ERASE_MARK_COLOR, alpha * 0.38));
        ellipse(px, py, pr, pr);
      }

      m.life--;
      if (m.life <= 0) this.eraseMarks.splice(i, 1);
    }
  }

  drawMouseEraseCursor() {
    if (this.app.isBackHit(mouseX, mouseY)) return;
    push();
    noFill();
    const alpha = mouseIsPressed ? 95 : 38;
    stroke(colorWithAlpha(this.C.ERASE_RING_COLOR, alpha));
    strokeWeight(mouseIsPressed ? 1.4 : 1);
    ellipse(mouseX, mouseY, this.C.MOUSE_ERASE_RADIUS * 2, this.C.MOUSE_ERASE_RADIUS * 2);

    if (mouseIsPressed) {
      noStroke();
      fill(colorWithAlpha(this.C.ERASE_MARK_COLOR, 45));
      ellipse(mouseX, mouseY, this.C.MOUSE_ERASE_RADIUS * 1.55, this.C.MOUSE_ERASE_RADIUS * 1.55);
    }
    pop();
  }

  drawUI() {
    push();
    textAlign(LEFT, TOP);
    fill(colorWithAlpha(this.C.UI_COLOR, 210));
    textSize(14);
    text("PROJECT Letter Waterway", 18, 16);

    fill(colorWithAlpha(this.C.UI_COLOR, 135));
    textSize(12);
    text("Mouse press / drag : erase settled letters", 18, 38);
    text("R : reset    Space : pause / resume", 18, 58);

    fill(colorWithAlpha(this.C.UI_COLOR, 105));
    text(`active: ${this.activeLetters.length}    settled: ${this.settledLetters.length}    last erased: ${this.lastErasedCount}`, 18, 78);

    fill(colorWithAlpha(this.C.UI_COLOR, 90));
    text("falling letters cycle through: P R O J E C T", 18, 98);
    pop();
  }
}

class FlowLetter {
  constructor(scene, x, y, ch, size) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.prevX = x;
    this.prevY = y;
    this.ch = ch;
    this.size = size;
    this.baseSize = size;
    this.g = 0;
    this.state = "flowing";
    this.targetX = x;
    this.targetY = y;
    this.pileCol = 0;
    this.pileLayerIndex = 0;
    this.offsetX = random(-2, 2);
    this.offsetY = random(-1, 1);
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;
    if (this.state === "flowing") this.updateFlowing();
    else if (this.state === "settling") this.updateSettling();
  }

  updateFlowing() {
    const C = this.scene.C;
    this.size *= C.LETTER_SHRINK;
    this.size = max(this.size, this.baseSize * 0.75);

    const n = noise(this.x * C.NOISE_SCALE_X, this.y * C.NOISE_SCALE_Y, this.scene.timeFlow * C.NOISE_SCALE_T);
    if (n > C.STRAIGHT_FALL_THRESHOLD) {
      this.g += C.FALL_ACCEL;
      this.y += this.g;
    } else {
      if (n % 0.1 > 0.05) this.x += C.SIDE_STEP;
      else this.x -= C.SIDE_STEP;
      this.g = 0;
      this.y += C.SLOW_FALL;
    }

    this.x = constrain(this.x, 4, this.scene.app.w - 4);
    const bottomLimit = this.scene.app.h - C.PILE_BOTTOM_MARGIN;
    if (this.y >= bottomLimit - 8) {
      this.assignPileTarget();
      this.state = "settling";
    }
  }

  updateSettling() {
    const C = this.scene.C;
    this.x = lerp(this.x, this.targetX, C.SETTLE_LERP_X);
    this.y = lerp(this.y, this.targetY, C.SETTLE_LERP_Y);
    const dx = abs(this.x - this.targetX);
    const dy = abs(this.y - this.targetY);
    if (dx < C.SETTLE_THRESHOLD && dy < C.SETTLE_THRESHOLD) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.state = "settled";
    }
  }

  assignPileTarget() {
    const C = this.scene.C;
    let baseCol = floor(this.x / C.PILE_CELL_W);
    baseCol = constrain(baseCol, 0, this.scene.pileHeights.length - 1);
    let bestCol = baseCol;
    let bestHeight = this.scene.pileHeights[baseCol];

    for (let offset = -3; offset <= 3; offset++) {
      const c = baseCol + offset;
      if (c < 0 || c >= this.scene.pileHeights.length) continue;
      if (this.scene.pileHeights[c] < bestHeight) {
        bestHeight = this.scene.pileHeights[c];
        bestCol = c;
      }
    }

    const layer = this.scene.pileHeights[bestCol];
    this.scene.pileHeights[bestCol]++;
    this.pileCol = bestCol;
    this.pileLayerIndex = layer;
    this.targetX = bestCol * C.PILE_CELL_W + C.PILE_CELL_W * 0.5 + this.offsetX;
    this.targetY = this.scene.app.h - C.PILE_BOTTOM_MARGIN - layer * C.PILE_ROW_H + this.offsetY;
    this.targetY = max(24, this.targetY);
  }

  display() {
    const C = this.scene.C;
    push();
    fill(colorWithAlpha(C.LETTER_COLOR_DIM, 90));
    textSize(this.size * 0.92);
    text(this.ch, this.prevX, this.prevY);

    fill(C.LETTER_COLOR);
    textSize(this.size);
    text(this.ch, this.x, this.y);
    pop();
  }
}

// ============================================================
// 4. Screenshot：截图雨滴雾效
// ============================================================
class ScreenshotScene extends BaseScene {
  constructor(app) {
    super(app);
    this.C = {
      COLOR_BG: "#000000",
      COLOR_FADE: "#3b3b3b",
      COLOR_RAIN_A: "#808080",
      COLOR_RAIN_B: "#808080",
      COLOR_TEXT: "#37ff00",
      COLOR_MOUSE: "#000000",
      BG_FADE_ALPHA: 8,
      DROPS_PER_FRAME: 2,
      DROP_SIZE_MIN: 4,
      DROP_SIZE_MAX: 22,
      DROP_OUTER_SCALE: 2.0,
      SPLASH_COUNT: 3,
      SPLASH_SPREAD: 2.0,
      STREAK_LENGTH_MIN: -110,
      STREAK_LENGTH_MAX: -35,
      RAIN_ALPHA: 24,
      EXTRA_POINTS_PER_FRAME: 5,
      FONT_FAMILY: "monospace",
      FONT_SIZE: 20,
      TEXT_ALPHA: 70,
      TEXT_CHANGE_INTERVAL: 2,
      TEXT_FOLLOW_DROP: true,
      TEXT_OFFSET_X_MIN: -12,
      TEXT_OFFSET_X_MAX: 12,
      TEXT_OFFSET_Y_MIN: -8,
      TEXT_OFFSET_Y_MAX: 8,
      SCREENSHOT_YEAR_MIN: 2024,
      SCREENSHOT_YEAR_MAX: 2026
    };
    this.currentScreenshotText = "";
  }

  onEnter() {
    super.onEnter();
    this.currentScreenshotText = "";
    background(this.C.COLOR_BG);
  }

  draw() {
    if (this.justEntered) background(this.C.COLOR_BG);

    noStroke();
    fillWithAlpha(this.C.COLOR_FADE, this.C.BG_FADE_ALPHA);
    rect(0, 0, this.app.w, this.app.h);

    for (let i = 0; i < this.C.DROPS_PER_FRAME; i++) {
      this.drawOneScreenshotRainDrop();
    }

    this.drawMouseMist();
    this.justEntered = false;
  }

  drawOneScreenshotRainDrop() {
    const C = this.C;
    const x = random(this.app.w);
    const y = random(this.app.h);
    const R = random(C.STREAK_LENGTH_MIN, C.STREAK_LENGTH_MAX);
    const W = map(R, C.STREAK_LENGTH_MAX, C.STREAK_LENGTH_MIN, C.DROP_SIZE_MIN, C.DROP_SIZE_MAX);
    const rainColor = random([C.COLOR_RAIN_A, C.COLOR_RAIN_B]);

    if (frameCount % C.TEXT_CHANGE_INTERVAL === 0) {
      this.currentScreenshotText = this.randomScreenshotName();
    }

    noStroke();
    fillWithAlpha(rainColor, C.RAIN_ALPHA);
    ellipse(x, y, W, W);

    fillWithAlpha(rainColor, C.RAIN_ALPHA * 0.55);
    ellipse(x, y, W * C.DROP_OUTER_SCALE, W * C.DROP_OUTER_SCALE);

    for (let i = 0; i < C.SPLASH_COUNT; i++) {
      const sx = x + random(-C.SPLASH_SPREAD * W, C.SPLASH_SPREAD * W);
      const sy = y + random(-C.SPLASH_SPREAD * W, C.SPLASH_SPREAD * W);
      const sw = W * random(0.18, 0.9);
      const sh = sw * random(0.75, 1.25);
      fillWithAlpha(rainColor, C.RAIN_ALPHA * random(0.3, 0.8));
      ellipse(sx, sy, sw, sh);
    }

    strokeWeight(max(1, W / 7));
    strokeWithAlpha(rainColor, C.RAIN_ALPHA);
    line(x, y, x + R / 2, y + R);

    strokeWeight(max(1, W / 5));
    strokeWithAlpha(rainColor, C.RAIN_ALPHA * 0.7);
    for (let i = 0; i < C.EXTRA_POINTS_PER_FRAME; i++) {
      point(random(this.app.w), random(this.app.h));
    }

    noStroke();
    fillWithAlpha(C.COLOR_TEXT, C.TEXT_ALPHA);
    textFont(C.FONT_FAMILY);
    textSize(C.FONT_SIZE);
    textAlign(CENTER, CENTER);

    常量 tx = C.TEXT_FOLLOW_DROP ? x + random(C.TEXT_OFFSET_X_MIN, C.TEXT_OFFSET_X_MAX) : this.app.w / 2;
    常量 ty = C.TEXT_FOLLOW_DROP ? y + random(C.TEXT_OFFSET_Y_MIN, C.TEXT_OFFSET_Y_MAX) : this.app.h / 2;
    text(this.currentScreenshotText, tx, ty);
  }

  drawMouseMist() {
    noStroke();
    fillWithAlpha(this.C.COLOR_MOUSE, 28);
    ellipse(mouseX, mouseY, 80, 80);
  }

  randomScreenshotName() {
    常量 dateStr = this.randomDateString();
    常量 id = nf(floor(random(0, 10000)), 4);
    return `screenshot_${dateStr}_${id}`;
  }

  randomDateString() {
    常量 start = 新 日期(this.C.SCREENSHOT_YEAR_MIN, 0, 1).getTime();
    常量 end = 新 日期(this.C.SCREENSHOT_YEAR_MAX, 11, 31).getTime();
    常量 t = random(start, end);
    常量 d = 新 日期(t);
    常量 年份 = d.getFullYear();
    常量 月 = nf(d.getMonth() + 1, 2);
    常量 dd = nf(d.getDate(), 2);
    return `${年份}${月}${dd}`;
  }
}
function toggleFullscreenMode() {
  常量 el = document.documentElement;

  if (!document.fullscreenElement) {
    if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

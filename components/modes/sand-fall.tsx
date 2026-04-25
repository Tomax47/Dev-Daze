"use client";

import { useEffect, useRef } from "react";

const CELL = 4; // px per grain

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

// Pre-bake all 360 hues → RGB once at module load
const COLOR_TABLE = Array.from({ length: 360 }, (_, h) => hslToRgb(h, 88, 62));

export function SandFall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLS = Math.floor(canvas.width / CELL);
    const ROWS = Math.floor(canvas.height / CELL);

    // Typed arrays — fast
    const grid = new Uint8Array(COLS * ROWS);        // 0=empty 1=sand
    const hues = new Uint16Array(COLS * ROWS);       // 0-359

    // Pixel buffer — 32-bit ABGR (little-endian canvas)
    const buf    = new ArrayBuffer(canvas.width * canvas.height * 4);
    const data8  = new Uint8ClampedArray(buf);
    const data32 = new Uint32Array(buf);
    const BLACK  = 0xff050408; // opaque near-black

    const mouse = { x: -1, y: -1, held: false, erase: false };
    let hueHead  = 0;   // rolls as you draw
    let autoTick = 0;   // for gentle auto-rain

    const at = (c: number, r: number) => r * COLS + c;

    /* ── Spawn sand grains in a circle ── */
    function paint(cx: number, cy: number, erase: boolean) {
      const gc = Math.floor(cx / CELL);
      const gr = Math.floor(cy / CELL);
      const rad = erase ? 6 : 4;
      const radSq = rad * rad;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          if (dx * dx + dy * dy > radSq) continue;
          const c = gc + dx, r = gr + dy;
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
          if (erase) {
            grid[at(c, r)] = 0;
          } else if (grid[at(c, r)] === 0 && Math.random() > 0.3) {
            grid[at(c, r)] = 1;
            hues[at(c, r)] = Math.floor(hueHead) % 360;
          }
        }
      }
      if (!erase) hueHead = (hueHead + 1.5) % 360;
    }

    /* ── Cellular automaton update — bottom to top ── */
    function update() {
      // Slow auto-rain so the canvas is never boring when idle
      autoTick++;
      if (!mouse.held && autoTick % 3 === 0) {
        const c = Math.floor(Math.random() * COLS);
        if (grid[at(c, 0)] === 0) {
          grid[at(c, 0)] = 1;
          hues[at(c, 0)] = Math.floor(hueHead) % 360;
          hueHead = (hueHead + 0.4) % 360;
        }
      }

      for (let row = ROWS - 2; row >= 0; row--) {
        // Alternate scan direction per row — prevents directional bias
        const ltr = (row & 1) === 0;
        for (let di = 0; di < COLS; di++) {
          const col = ltr ? di : COLS - 1 - di;
          if (grid[at(col, row)] !== 1) continue;

          const below = row + 1;

          if (grid[at(col, below)] === 0) {
            // Fall straight down
            grid[at(col, below)] = 1;
            hues[at(col, below)] = hues[at(col, row)];
            grid[at(col, row)] = 0;
          } else {
            // Slide diagonally — randomise which side to try first
            const goLeft = Math.random() > 0.5;
            const d1 = col + (goLeft ? -1 : 1);
            const d2 = col + (goLeft ? 1 : -1);

            if (d1 >= 0 && d1 < COLS && grid[at(d1, below)] === 0) {
              grid[at(d1, below)] = 1;
              hues[at(d1, below)] = hues[at(col, row)];
              grid[at(col, row)] = 0;
            } else if (d2 >= 0 && d2 < COLS && grid[at(d2, below)] === 0) {
              grid[at(d2, below)] = 1;
              hues[at(d2, below)] = hues[at(col, row)];
              grid[at(col, row)] = 0;
            }
          }
        }
      }
    }

    /* ── Render via ImageData ── */
    function render() {
      // Fill entire buffer with near-black
      data32.fill(BLACK);

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          if (grid[at(col, row)] === 0) continue;

          const [r, g, b] = COLOR_TABLE[hues[at(col, row)]];
          // Add slight brightness variation for grain texture
          const jitter = (Math.random() * 16 - 8) | 0;
          const R = Math.min(255, r + jitter);
          const G = Math.min(255, g + jitter);
          const B = Math.min(255, b + jitter);
          const color32 = (0xff << 24) | (B << 16) | (G << 8) | R;

          const px0 = col * CELL;
          const py0 = row * CELL;
          for (let py = 0; py < CELL; py++) {
            const rowBase = (py0 + py) * canvas.width + px0;
            for (let px = 0; px < CELL; px++) {
              data32[rowBase + px] = color32;
            }
          }
        }
      }

      ctx.putImageData(new ImageData(data8, canvas.width, canvas.height), 0, 0);

      // Hint text drawn after ImageData (overlays cleanly)
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        "Draw with mouse or touch  ·  right-click to erase  ·  double-click to clear",
        canvas.width / 2,
        canvas.height - 20
      );
    }

    /* ── Main loop ── */
    function loop() {
      if (mouse.held) paint(mouse.x, mouse.y, mouse.erase);
      update();
      render();
      raf = requestAnimationFrame(loop);
    }

    /* ── Events ── */
    function onDown(e: MouseEvent) {
      mouse.held = true;
      mouse.erase = e.button === 2;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function onMove(e: MouseEvent) { mouse.x = e.clientX; mouse.y = e.clientY; }
    function onUp()   { mouse.held = false; }
    function onCtx(e: MouseEvent) { e.preventDefault(); }
    function onDbl()  { grid.fill(0); }

    function onTouchStart(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      mouse.held = true;
      mouse.erase = false;
      mouse.x = t.clientX;
      mouse.y = t.clientY;
    }
    function onTouchMove(e: TouchEvent) {
      e.preventDefault();
      const t = e.touches[0];
      mouse.x = t.clientX;
      mouse.y = t.clientY;
    }
    function onTouchEnd() { mouse.held = false; }

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("contextmenu", onCtx);
    canvas.addEventListener("dblclick", onDbl);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd);

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", onResize);

    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("contextmenu", onCtx);
      canvas.removeEventListener("dblclick", onDbl);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ cursor: "crosshair", width: "100%", height: "100%" }}
    />
  );
}

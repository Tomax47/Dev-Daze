"use client";

import { useEffect, useRef } from "react";

interface Drop {
  x: number; y: number; r: number;
  vx: number; vy: number;
  trail: Array<{ x: number; y: number }>;
  alpha: number;
}

const BOKEH_HUES = [35, 48, 200, 215, 110, 280];

export function RainGlass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let raf: number;
    let frame = 0;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const W = () => canvas.width;
    const H = () => canvas.height;

    const bokeh = Array.from({ length: 16 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     85 + Math.random() * 155,
      hue:   BOKEH_HUES[Math.floor(Math.random() * BOKEH_HUES.length)],
      alpha: 0.06 + Math.random() * 0.10,
    }));

    // Offscreen canvas — drawn once, reused for the per-drop lens magnification
    const bgCanvas  = document.createElement("canvas");
    bgCanvas.width  = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    const bgCtx     = bgCanvas.getContext("2d")!;

    function paintBg(c: CanvasRenderingContext2D) {
      c.fillStyle = "#06101e";
      c.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
      for (const b of bokeh) {
        const g = c.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0,    `hsla(${b.hue},80%,68%,${b.alpha * 2.8})`);
        g.addColorStop(0.45, `hsla(${b.hue},72%,55%,${b.alpha})`);
        g.addColorStop(1,    `hsla(${b.hue},70%,50%,0)`);
        c.fillStyle = g;
        c.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }
    }
    paintBg(bgCtx);

    const drops: Drop[] = [];
    const mouse = { x: 0, y: 0, down: false };
    const wipeTrail: Array<{ x: number; y: number; alpha: number }> = [];

    function spawnDrop(x?: number, y?: number, r?: number) {
      drops.push({
        x:     x ?? Math.random() * W(),
        y:     y ?? Math.random() * H() * 0.92,
        r:     r ?? (1 + Math.random() * 3),
        vx: 0, vy: 0,
        trail: [],
        alpha: 0.6 + Math.random() * 0.4,
      });
    }

    for (let i = 0; i < 200; i++) spawnDrop(undefined, undefined, 0.8 + Math.random() * 2.5);

    function tryMerge() {
      outer: for (let i = drops.length - 1; i >= 1; i--) {
        for (let j = i - 1; j >= 0; j--) {
          const a = drops[i], b = drops[j];
          if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 0.8) {
            b.x = (a.x * a.r + b.x * b.r) / (a.r + b.r);
            b.y = (a.y * a.r + b.y * b.r) / (a.r + b.r);
            b.r = Math.min(16, Math.sqrt(a.r * a.r + b.r * b.r));
            drops.splice(i, 1);
            continue outer;
          }
        }
      }
    }

    function update() {
      frame++;
      if (frame % 4 === 0) spawnDrop(undefined, undefined, 0.8 + Math.random() * 2);
      if (frame % 7 === 0) tryMerge();

      for (let i = wipeTrail.length - 1; i >= 0; i--) {
        wipeTrail[i].alpha -= 0.007;
        if (wipeTrail[i].alpha <= 0) wipeTrail.splice(i, 1);
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];

        if (mouse.down) {
          const dx = d.x - mouse.x, dy = d.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const wr   = 32 + d.r * 2.5;
          if (dist < wr && dist > 0.1) {
            const f = (1 - dist / wr) * 4.2;
            d.vx += (dx / dist) * f;
            d.vy += (dy / dist) * f * 0.65;
          }
        }

        if (d.r >= 5) {
          d.vy += 0.055 + d.r * 0.009;
          d.vx += (Math.random() - 0.5) * 0.025;
          d.vx *= 0.96;
          d.vy *= 0.99;
          const last = d.trail[d.trail.length - 1];
          if (!last || Math.hypot(d.x - last.x, d.y - last.y) > 2) {
            d.trail.push({ x: d.x, y: d.y });
            if (d.trail.length > 38) d.trail.shift();
          }
        } else {
          d.vx *= 0.80;
          d.vy *= 0.80;
          if (frame % 100 === 0) d.r += 0.02;
        }

        d.x += d.vx; d.y += d.vy;
        if (d.y > H() + 25 || d.x < -40 || d.x > W() + 40) drops.splice(i, 1);
      }

      if (drops.length > 550) drops.splice(0, drops.length - 550);
    }

    // Large drops: clip-and-scale the bg canvas to fake lens magnification
    function drawLensDrop(d: Drop) {
      const { x, y, r, alpha } = d;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.94, 0, Math.PI * 2);
      ctx.clip();
      ctx.translate(x, y);
      ctx.scale(1.5, 1.5);
      ctx.translate(-x, -y);
      ctx.drawImage(bgCanvas, 0, 0);
      ctx.restore();

      // Blue-water tint inside
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r * 0.94, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = `rgba(20,70,160,${alpha * 0.14})`;
      ctx.fill();
      ctx.restore();

      // Surface-tension rim
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      const rim = ctx.createRadialGradient(x, y, r * 0.72, x, y, r);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(1, `rgba(5,40,95,${alpha * 0.65})`);
      ctx.fillStyle = rim;
      ctx.fill();

      // Primary specular
      const hlx = x - r * 0.27, hly = y - r * 0.31;
      const hl  = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, r * 0.36);
      hl.addColorStop(0,   `rgba(255,255,255,${alpha * 0.92})`);
      hl.addColorStop(0.5, `rgba(255,255,255,${alpha * 0.18})`);
      hl.addColorStop(1,   "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(hlx, hly, r * 0.36, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();

      // Secondary specular
      const h2x = x + r * 0.34, h2y = y + r * 0.26;
      const hl2 = ctx.createRadialGradient(h2x, h2y, 0, h2x, h2y, r * 0.12);
      hl2.addColorStop(0, `rgba(255,255,255,${alpha * 0.38})`);
      hl2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(h2x, h2y, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = hl2;
      ctx.fill();
    }

    function drawSmallDrop(d: Drop) {
      const { x, y, r, alpha } = d;
      const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, 0, x + r * 0.1, y + r * 0.1, r);
      g.addColorStop(0,   `rgba(210,235,255,${alpha * 0.82})`);
      g.addColorStop(0.5, `rgba(130,185,240,${alpha * 0.35})`);
      g.addColorStop(1,   `rgba(70,130,215,${alpha * 0.08})`);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    function render() {
      ctx.drawImage(bgCanvas, 0, 0);

      // Wet-glass darkening layer
      ctx.fillStyle = "rgba(6,12,26,0.18)";
      ctx.fillRect(0, 0, W(), H());

      // Wipe marks — briefly brighter where the glass was wiped
      for (const w of wipeTrail) {
        const wg = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, 26);
        wg.addColorStop(0, `rgba(190,218,255,${w.alpha * 0.16})`);
        wg.addColorStop(1, "rgba(190,218,255,0)");
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.arc(w.x, w.y, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Trails behind sliding drops
      ctx.save();
      ctx.lineCap = "round";
      for (const d of drops) {
        if (d.trail.length < 3 || d.r < 5) continue;
        ctx.beginPath();
        ctx.moveTo(d.trail[0].x, d.trail[0].y);
        for (let i = 1; i < d.trail.length; i++) ctx.lineTo(d.trail[i].x, d.trail[i].y);
        ctx.strokeStyle = "rgba(100,165,230,0.07)";
        ctx.lineWidth   = d.r * 0.85;
        ctx.stroke();
      }
      ctx.restore();

      // Small drops first so large drops render on top
      const sorted = [...drops].sort((a, b) => a.r - b.r);
      for (const d of sorted) {
        if (d.r >= 4) drawLensDrop(d);
        else drawSmallDrop(d);
      }

      // Subtle diagonal glass glare
      const glare = ctx.createLinearGradient(0, 0, W() * 0.55, H() * 0.55);
      glare.addColorStop(0,   "rgba(210,228,255,0.028)");
      glare.addColorStop(0.5, "rgba(210,228,255,0.042)");
      glare.addColorStop(1,   "rgba(210,228,255,0.005)");
      ctx.fillStyle = glare;
      ctx.fillRect(0, 0, W(), H());

      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.font      = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Drag to wipe the glass", W() / 2, H() - 22);
    }

    function loop() { update(); render(); raf = requestAnimationFrame(loop); }

    const onMouseDown = (e: MouseEvent) => { mouse.down = true; mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (mouse.down) wipeTrail.push({ x: e.clientX, y: e.clientY, alpha: 0.75 });
    };
    const onMouseUp   = () => { mouse.down = false; };
    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      mouse.down = true;
      mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
      if (mouse.down) wipeTrail.push({ x: mouse.x, y: mouse.y, alpha: 0.75 });
    };
    const onTouchEnd  = () => { mouse.down = false; };
    const onResize    = () => {
      canvas.width  = window.innerWidth; canvas.height = window.innerHeight;
      bgCanvas.width = window.innerWidth; bgCanvas.height = window.innerHeight;
      paintBg(bgCtx);
    };

    canvas.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mousemove",  onMouseMove);
    window.addEventListener("mouseup",    onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd);
    window.addEventListener("resize",     onResize);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mousemove",  onMouseMove);
      window.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("resize",     onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0"
      style={{ width: "100%", height: "100%", cursor: "crosshair" }} />
  );
}

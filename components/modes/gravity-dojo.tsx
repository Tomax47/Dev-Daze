"use client";

import { useEffect, useRef } from "react";

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  mass: number;
  hue: number;
  sat: number;
  grabbed: boolean;
}

export function GravityDojo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const W = () => canvas.width;
    const H = () => canvas.height;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const GRAVITY_STRENGTH = 0.38;
    const BOUNCE = 0.62;
    const FRICTION = 0.991;

    const SIZES = [
      28, 22, 18, 34, 20, 26, 16, 30, 22, 18, 24, 28, 20, 16, 32,
      14, 24, 19, 26, 15, 30, 21, 17, 28, 23, 13, 25, 19, 31, 16,
      22, 18, 27, 20, 15, 29, 17, 24, 21, 14,
    ];
    const HUES = [
      260, 200, 280, 220, 310, 170, 250, 190, 300, 240, 210, 270, 185, 290, 230,
      260, 200, 280, 220, 310, 170, 250, 190, 300, 240, 210, 270, 185, 290, 230,
      260, 200, 280, 220, 310, 170, 250, 190, 300, 240,
    ];

    const balls: Ball[] = SIZES.map((r, i) => ({
      id: i,
      x: W() / 2 + (Math.random() - 0.5) * W() * 0.9,
      y: H() / 2 + (Math.random() - 0.5) * H() * 0.9,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      r,
      mass: r * r * 0.01,
      hue: HUES[i],
      sat: 70 + Math.random() * 20,
      grabbed: false,
    }));

    const mouse = { x: 0, y: 0 };
    let grabbed: Ball | null = null;
    let prevMx = 0, prevMy = 0;

    function resolveCollision(a: Ball, b: Ball) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.r + b.r;
      if (dist >= minDist || dist === 0) return;

      const overlap = (minDist - dist) / 2;
      const nx = dx / dist, ny = dy / dist;
      a.x -= nx * overlap;
      a.y -= ny * overlap;
      b.x += nx * overlap;
      b.y += ny * overlap;

      const relVx = b.vx - a.vx;
      const relVy = b.vy - a.vy;
      const dot = relVx * nx + relVy * ny;
      if (dot > 0) return;

      const e = 0.55;
      const j = -(1 + e) * dot / (1 / a.mass + 1 / b.mass);
      a.vx -= (j * nx) / a.mass;
      a.vy -= (j * ny) / a.mass;
      b.vx += (j * nx) / b.mass;
      b.vy += (j * ny) / b.mass;
    }

    function drawBall(b: Ball) {
      const grd = ctx.createRadialGradient(
        b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.1,
        b.x, b.y, b.r
      );
      grd.addColorStop(0, `hsla(${b.hue},${b.sat}%,82%,0.95)`);
      grd.addColorStop(0.6, `hsla(${b.hue},${b.sat}%,55%,0.9)`);
      grd.addColorStop(1, `hsla(${b.hue},${b.sat}%,28%,0.85)`);

      // Glow
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r + 6, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${b.hue},80%,60%,${b.grabbed ? 0.4 : 0.12})`;
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // Specular
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.28, b.r * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W(), H());

      const cx = W() / 2;
      const cy = H() / 2;

      // Background
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W(), H()) * 0.7);
      bg.addColorStop(0, "#0e0a1e");
      bg.addColorStop(1, "#050408");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W(), H());

      // Subtle center glow
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      cg.addColorStop(0, "rgba(120,80,255,0.12)");
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W(), H());

      // Center cross-hair
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fill();

      // Physics
      for (const b of balls) {
        if (b.grabbed) {
          b.vx += (mouse.x - b.x) * 0.28;
          b.vy += (mouse.y - b.y) * 0.28;
          b.vx *= 0.7;
          b.vy *= 0.7;
        } else {
          // Pull toward screen center
          const dx = cx - b.x;
          const dy = cy - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          b.vx += (dx / dist) * GRAVITY_STRENGTH;
          b.vy += (dy / dist) * GRAVITY_STRENGTH;
          b.vx *= FRICTION;
          b.vy *= FRICTION;
        }

        b.x += b.vx;
        b.y += b.vy;

        // Soft boundary — bounce off screen edges
        if (b.x - b.r < 0)    { b.x = b.r;        b.vx *= -BOUNCE; }
        if (b.x + b.r > W())  { b.x = W() - b.r;  b.vx *= -BOUNCE; }
        if (b.y - b.r < 0)    { b.y = b.r;         b.vy *= -BOUNCE; }
        if (b.y + b.r > H())  { b.y = H() - b.r;  b.vy *= -BOUNCE; }
      }

      // Collision passes
      for (let pass = 0; pass < 3; pass++) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            resolveCollision(balls[i], balls[j]);
          }
        }
      }

      for (const b of balls) drawBall(b);

      // Hint
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Drag any ball and throw it", cx, H() - 20);

      prevMx = mouse.x;
      prevMy = mouse.y;
      raf = requestAnimationFrame(draw);
    }

    function nearest(x: number, y: number) {
      let best: Ball | null = null;
      let bestD = Infinity;
      for (const b of balls) {
        const dx = b.x - x, dy = b.y - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < b.r + 20 && d < bestD) { best = b; bestD = d; }
      }
      return best;
    }

    function onDown(e: MouseEvent) {
      mouse.x = e.clientX; mouse.y = e.clientY;
      grabbed = nearest(e.clientX, e.clientY);
      if (grabbed) grabbed.grabbed = true;
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX; mouse.y = e.clientY;
    }

    function onUp() {
      if (grabbed) {
        grabbed.grabbed = false;
        grabbed.vx = mouse.x - prevMx;
        grabbed.vy = mouse.y - prevMy;
        grabbed = null;
      }
    }

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ cursor: "grab", width: "100%", height: "100%" }}
    />
  );
}

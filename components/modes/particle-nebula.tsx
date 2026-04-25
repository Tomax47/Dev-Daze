"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  baseR: number;
  hue: number;
  alpha: number;
  trail: { x: number; y: number }[];
}

export function ParticleNebula() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const mouse = { x: -9999, y: -9999, down: false };
    let hueShift = 0;
    let raf: number;

    const W = () => (canvas.width = window.innerWidth);
    const H = () => (canvas.height = window.innerHeight);
    W(); H();

    const PARTICLE_COUNT = 200;
    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () =>
      spawn(canvas.width, canvas.height)
    );

    function spawn(w: number, h: number): Particle {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r: Math.random() * 2 + 0.8,
        baseR: Math.random() * 2 + 0.8,
        hue: Math.random() * 60 + 240,
        alpha: Math.random() * 0.5 + 0.3,
        trail: [],
      };
    }

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function draw() {
      hueShift = (hueShift + 0.15) % 360;

      ctx.fillStyle = "rgba(0,0,0,0.18)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const mx = mouse.x;
      const my = mouse.y;

      for (const p of particles) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 12) p.trail.shift();

        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repel = 160;
        const attract = 300;

        if (dist < repel && dist > 0) {
          const force = ((repel - dist) / repel) * 2.5;
          p.vx -= (dx / dist) * force;
          p.vy -= (dy / dist) * force;
          p.r = Math.min(p.baseR * 3, p.r + 0.3);
        } else if (mouse.down && dist < attract && dist > 0) {
          const force = ((attract - dist) / attract) * 0.8;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        } else {
          p.r = Math.max(p.baseR, p.r - 0.1);
        }

        p.vx *= 0.97;
        p.vy *= 0.97;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.y < -10) p.y = canvas.height + 10;
        if (p.y > canvas.height + 10) p.y = -10;

        // Trail
        if (p.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.strokeStyle = `hsla(${p.hue + hueShift},90%,70%,0.08)`;
          ctx.lineWidth = p.r * 0.5;
          ctx.stroke();
        }

        // Dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + hueShift},90%,70%,${p.alpha})`;
        ctx.fill();
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2 + hueShift},80%,70%,${(1 - d / 90) * 0.12})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Mouse glow
      if (mx > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 120);
        grad.addColorStop(0, `hsla(${hueShift + 260},90%,80%,0.12)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      raf = requestAnimationFrame(draw);
    }

    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    canvas.addEventListener("mousedown", () => { mouse.down = true; });
    canvas.addEventListener("mouseup", () => { mouse.down = false; });
    canvas.addEventListener("mouseleave", () => { mouse.x = -9999; mouse.y = -9999; });

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-crosshair"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

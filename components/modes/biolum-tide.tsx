"use client";

import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 2600;
const GLOW_RADIUS    = 88;

interface Particle {
  x: number; y: number;
  baseX: number; baseY: number;
  glow: number;
  phase: number;
  hue: number;
  r: number;
}

export function BiolumTide() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const W = () => canvas.width;
    const H = () => canvas.height;

    const mouse = { x: -999, y: -999 };
    let particles: Particle[] = [];

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => {
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        return {
          x, y, baseX: x, baseY: y,
          glow:  0,
          phase: Math.random() * Math.PI * 2,
          hue:   162 + Math.random() * 32,
          r:     0.7 + Math.random() * 1.5,
        };
      });
    }
    initParticles();

    function update() {
      t += 0.012;

      for (const p of particles) {
        p.x = p.baseX + Math.sin(p.phase + t * 0.5)  * 9;
        p.y = p.baseY + Math.cos(p.phase * 1.3 + t * 0.4) * 6;

        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < GLOW_RADIUS) {
          p.glow = Math.min(1, p.glow + (1 - dist / GLOW_RADIUS) * 0.14);
        }

        const ambient = 0.018 + 0.013 * Math.sin(p.phase * 2 + t * 0.9);
        p.glow = Math.max(ambient, p.glow * 0.976);
      }
    }

    function render() {
      ctx.fillStyle = "#01060a";
      ctx.fillRect(0, 0, W(), H());

      const horizGrad = ctx.createLinearGradient(0, H() * 0.5, 0, H());
      horizGrad.addColorStop(0, `hsla(190,80%,14%,${0.10 + 0.04 * Math.sin(t * 0.3)})`);
      horizGrad.addColorStop(1, "transparent");
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, 0, W(), H());

      for (const p of particles) {
        if (p.glow < 0.022) continue;
        ctx.save();
        ctx.globalAlpha  = p.glow;
        ctx.shadowBlur   = 14 * p.glow;
        ctx.shadowColor  = `hsl(${p.hue},100%,65%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + p.glow * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${p.hue},100%,${68 + p.glow * 22}%)`;
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = "rgba(255,255,255,0.11)";
      ctx.font      = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Move or touch to illuminate the tide", W() / 2, H() - 22);
    }

    function loop() { update(); render(); raf = requestAnimationFrame(loop); }

    const onMove  = (e: MouseEvent)  => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = ()               => { mouse.x = -999; mouse.y = -999; };
    const onTouch = (e: TouchEvent)  => {
      e.preventDefault();
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    };
    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("touchmove",  onTouch, { passive: false });
    window.addEventListener("resize",     onResize);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("touchmove",  onTouch);
      window.removeEventListener("resize",     onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0"
      style={{ width: "100%", height: "100%", cursor: "none" }} />
  );
}

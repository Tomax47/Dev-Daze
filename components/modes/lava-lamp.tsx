"use client";

import { useEffect, useRef } from "react";

interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  targetR: number;
  hue: number;
  phase: number;
  phaseSpeed: number;
}

export function LavaLamp() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let t = 0;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const mouse = { x: -999, y: -999 };

    // Warm palette — oranges, pinks, reds, ambers
    const HUES = [15, 340, 30, 0, 350, 25, 5, 320, 40, 345];

    const blobs: Blob[] = Array.from({ length: 11 }, (_, i) => {
      const r = 55 + Math.random() * 80;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.9,
        vy: (Math.random() - 0.5) * 0.9,
        r,
        targetR: r,
        hue: HUES[i % HUES.length],
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.003 + Math.random() * 0.004,
      };
    });

    function draw() {
      t += 0.01;

      // Black background (required for CSS contrast trick to work)
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const b of blobs) {
        b.phase += b.phaseSpeed;

        // Gentle drift with sinusoidal oscillation — slow and hypnotic
        b.vx += Math.cos(t * 0.6 + b.phase) * 0.022;
        b.vy += Math.sin(t * 0.5 + b.phase * 1.3) * 0.022;

        // Very slight upward bias (lava rises)
        b.vy -= 0.008;

        // Mouse repel — gentle push
        const dx = b.x - mouse.x;
        const dy = b.y - mouse.y;
        const md = Math.sqrt(dx * dx + dy * dy);
        const repelR = 160;
        if (md < repelR && md > 0) {
          const force = ((repelR - md) / repelR) * 0.55;
          b.vx += (dx / md) * force;
          b.vy += (dy / md) * force;
        }

        // Speed cap
        const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
        if (speed > 1.8) { b.vx = (b.vx / speed) * 1.8; b.vy = (b.vy / speed) * 1.8; }

        b.vx *= 0.986;
        b.vy *= 0.986;
        b.x += b.vx;
        b.y += b.vy;

        // Wrap softly at edges
        const pad = b.r;
        if (b.x < -pad) b.x = canvas.width + pad;
        if (b.x > canvas.width + pad) b.x = -pad;
        if (b.y < -pad) b.y = canvas.height + pad;
        if (b.y > canvas.height + pad) b.y = -pad;

        // Breathe: slowly grow/shrink
        b.targetR = 55 + Math.sin(b.phase * 0.7) * 25 + 40;
        b.r += (b.targetR - b.r) * 0.008;

        // Draw solid circle — CSS filter will merge overlapping ones
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${b.hue},90%,58%)`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function onClick(e: MouseEvent) {
      // Spawn a new temporary blob at click position
      const r = 40 + Math.random() * 40;
      const newBlob: Blob = {
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 1.5,
        r,
        targetR: r,
        hue: HUES[Math.floor(Math.random() * HUES.length)],
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.003 + Math.random() * 0.004,
      };
      blobs.push(newBlob);
      // Remove oldest if too many
      if (blobs.length > 18) blobs.shift();
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onLeave() {
      mouse.x = -999;
      mouse.y = -999;
    }

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", onResize);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click", onClick);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="absolute inset-0" style={{ background: "#110005" }}>
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ filter: "blur(14px) contrast(22) saturate(1.8)" }}
      >
        <canvas ref={canvasRef} />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,80,30,0.06), transparent)",
          mixBlendMode: "screen",
        }}
      />

      <div
        className="absolute bottom-7 left-0 right-0 text-center pointer-events-none"
        style={{ color: "rgba(255,255,255,0.18)", fontSize: 13, fontFamily: "system-ui" }}
      >
        Move cursor to push blobs · click to spawn one
      </div>
    </div>
  );
}

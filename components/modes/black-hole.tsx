"use client";

import { useEffect, useRef } from "react";

interface Dot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  alpha: number;
  dead: boolean;
  eatProgress: number;
}

export function BlackHole() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let hole = { x: window.innerWidth / 2, y: (window.innerHeight - 60) / 2 };
    let holeR = 36;
    let accretionAngle = 0;
    let mouthOpen = 0; // grows as dots are eaten

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const GRAVITY = 3200;
    const EVENT_HORIZON = holeR + 4;
    const DOT_COUNT = 180;

    function spawnDot(): Dot {
      const side = Math.floor(Math.random() * 4);
      let x = 0, y = 0;
      if (side === 0) { x = Math.random() * canvas.width; y = -10; }
      else if (side === 1) { x = canvas.width + 10; y = Math.random() * canvas.height; }
      else if (side === 2) { x = Math.random() * canvas.width; y = canvas.height + 10; }
      else { x = -10; y = Math.random() * canvas.height; }

      const speed = Math.random() * 1.5 + 0.5;
      const angle = Math.random() * Math.PI * 2;
      return {
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: Math.random() * 3 + 1.5,
        hue: Math.random() * 80 + 180,
        alpha: Math.random() * 0.5 + 0.5,
        dead: false,
        eatProgress: 0,
      };
    }

    const dots: Dot[] = Array.from({ length: DOT_COUNT }, spawnDot);

    function drawBlackHole() {
      const { x, y } = hole;

      // Outer glow
      const outerGlow = ctx.createRadialGradient(x, y, holeR, x, y, holeR * 6);
      outerGlow.addColorStop(0, "rgba(80,0,120,0.25)");
      outerGlow.addColorStop(0.4, "rgba(30,0,60,0.15)");
      outerGlow.addColorStop(1, "transparent");
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(x, y, holeR * 6, 0, Math.PI * 2);
      ctx.fill();

      // Accretion disk rings
      for (let ring = 0; ring < 4; ring++) {
        const ringR = holeR + 10 + ring * 14;
        const width = 6 - ring;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(accretionAngle + ring * 0.4);
        ctx.scale(1, 0.28);
        ctx.beginPath();
        ctx.arc(0, 0, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${290 - ring * 20},90%,${60 - ring * 8}%,${0.55 - ring * 0.1})`;
        ctx.lineWidth = width;
        ctx.stroke();
        ctx.restore();
      }

      // Photon sphere glow
      const photonGrad = ctx.createRadialGradient(x, y, holeR - 4, x, y, holeR + 8);
      photonGrad.addColorStop(0, "rgba(200,100,255,0.7)");
      photonGrad.addColorStop(1, "transparent");
      ctx.fillStyle = photonGrad;
      ctx.beginPath();
      ctx.arc(x, y, holeR + 8, 0, Math.PI * 2);
      ctx.fill();

      // Black core
      ctx.beginPath();
      ctx.arc(x, y, holeR, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();

      // Inner rim
      ctx.beginPath();
      ctx.arc(x, y, holeR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(160,60,255,0.9)";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    function drawDot(d: Dot) {
      if (d.dead) return;
      const dx = hole.x - d.x;
      const dy = hole.y - d.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const proximity = Math.max(0, 1 - dist / 300);

      const r = d.r * (1 - d.eatProgress * 0.8);
      const alpha = d.alpha * (1 - d.eatProgress);
      const hue = d.hue + proximity * 60; // shifts toward purple near hole

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue},80%,70%,${alpha})`;
      ctx.fill();

      // Stretch/distort near event horizon (glow)
      if (dist < 120) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, r + 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue},90%,80%,${alpha * 0.3})`;
        ctx.fill();
      }
    }

    function flash(x: number, y: number) {
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200,150,255,0.5)";
      ctx.fill();
    }

    let flashTimer = 0;
    let flashX = 0, flashY = 0;

    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.8 + 0.2,
      a: Math.random() * 0.6 + 0.2,
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      accretionAngle += 0.018;
      mouthOpen = Math.max(0, mouthOpen - 0.01);

      // Space background gradient
      const bg = ctx.createRadialGradient(
        hole.x, hole.y, 0,
        hole.x, hole.y, canvas.width * 0.8
      );
      bg.addColorStop(0, "#0a0010");
      bg.addColorStop(0.5, "#050008");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Starfield
      for (const s of stars) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.a})`;
        ctx.fill();
      }

      // Update + draw dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        if (d.dead) {
          dots[i] = spawnDot();
          continue;
        }

        const dx = hole.x - d.x;
        const dy = hole.y - d.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);

        // Gravity
        const force = GRAVITY / (distSq + 100);
        d.vx += (dx / dist) * force;
        d.vy += (dy / dist) * force;

        // Orbital tangential nudge (keeps things spiraling vs. straight-in)
        const perp = 0.8 / (dist * 0.012 + 1);
        d.vx += (-dy / dist) * perp * 0.015;
        d.vy += (dx / dist) * perp * 0.015;

        d.vx *= 0.995;
        d.vy *= 0.995;
        d.x += d.vx;
        d.y += d.vy;

        if (dist < EVENT_HORIZON + 20) {
          d.eatProgress += 0.08;
        }

        if (dist < EVENT_HORIZON || d.eatProgress >= 1) {
          flashX = d.x; flashY = d.y; flashTimer = 4;
          mouthOpen = Math.min(1, mouthOpen + 0.15);
          d.dead = true;
        }

        drawDot(d);
      }

      if (flashTimer > 0) {
        flash(flashX, flashY);
        flashTimer--;
      }

      drawBlackHole();

      // Hint
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Click to move the black hole", canvas.width / 2, canvas.height - 28);

      raf = requestAnimationFrame(draw);
    }
    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function onClick(e: MouseEvent) {
      hole = { x: e.clientX, y: e.clientY };
    }

    window.addEventListener("resize", onResize);
    canvas.addEventListener("click", onClick);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onClick);
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

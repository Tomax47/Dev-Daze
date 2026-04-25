"use client";

import { useEffect, useRef } from "react";

const SEGMENTS = 12; // 12-fold symmetry + mirror = 24 identical strokes per move

export function Kaleidoscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    function resize() {
      // Preserve drawing on resize by copying to temp
      const tmp = document.createElement("canvas");
      tmp.width = canvas.width;
      tmp.height = canvas.height;
      tmp.getContext("2d")!.drawImage(canvas, 0, 0);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      fill();
      ctx.drawImage(tmp, 0, 0);
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function fill() {
      ctx.fillStyle = "#04030a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    fill();

    // Polar coords relative to center
    let prevAngle = 0;
    let prevRadius = 0;
    let hue = 180;
    let t = 0;

    // Idle auto-draw: slowly rotate virtual point
    let idleAngle = 0;
    let idleRadius = 0;
    let idleTarget = Math.min(canvas.width, canvas.height) * 0.28;
    let isMoving = false;
    let moveTimeout: ReturnType<typeof setTimeout>;

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    function stroke(
      a1: number, r1: number,
      a2: number, r2: number,
      lineWidth: number,
      color: string
    ) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.lineCap = "round";

      for (let i = 0; i < SEGMENTS; i++) {
        const off = (Math.PI * 2 / SEGMENTS) * i;

        // Normal
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a1 + off) * r1, cy + Math.sin(a1 + off) * r1);
        ctx.lineTo(cx + Math.cos(a2 + off) * r2, cy + Math.sin(a2 + off) * r2);
        ctx.stroke();

        // Mirror (flip angle sign = kaleidoscope reflection)
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(-a1 + off) * r1, cy + Math.sin(-a1 + off) * r1);
        ctx.lineTo(cx + Math.cos(-a2 + off) * r2, cy + Math.sin(-a2 + off) * r2);
        ctx.stroke();
      }
    }

    function draw() {
      t += 0.012;
      hue = (hue + 0.35) % 360;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Gentle fade — trails linger ~8 seconds at 60fps
      ctx.fillStyle = "rgba(4, 3, 10, 0.008)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let curAngle: number;
      let curRadius: number;

      if (isMoving) {
        const dx = mouse.x - cx;
        const dy = mouse.y - cy;
        curAngle  = Math.atan2(dy, dx);
        curRadius = Math.sqrt(dx * dx + dy * dy);
      } else {
        // Idle: figure-eight Lissajous path — always drawing, never boring
        idleAngle  = (idleAngle + 0.008) % (Math.PI * 2);
        idleRadius = idleTarget * (0.5 + 0.5 * Math.sin(idleAngle * 2.3));
        const idleX = Math.cos(idleAngle * 1.7) * idleRadius;
        const idleY = Math.sin(idleAngle * 2.1) * idleRadius * 0.7;
        curAngle  = Math.atan2(idleY, idleX);
        curRadius = Math.sqrt(idleX * idleX + idleY * idleY);
      }

      // Skip if jump is too large (prevents cross-segment artefacts)
      const angleDelta  = Math.abs(curAngle - prevAngle);
      const radiusDelta = Math.abs(curRadius - prevRadius);
      const bigJump = angleDelta > 0.25 || radiusDelta > 60;

      if (!bigJump) {
        // Brush size: thicker near center, finer at edges
        const size = Math.max(1.5, 5 - curRadius * 0.008);

        // Glow pass — wider, low opacity
        ctx.shadowBlur = 18;
        ctx.shadowColor = `hsla(${hue}, 85%, 75%, 0.6)`;
        stroke(
          prevAngle, prevRadius, curAngle, curRadius,
          size * 2.2,
          `hsla(${hue}, 80%, 65%, 0.18)`
        );

        // Core stroke
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${hue}, 90%, 85%, 0.9)`;
        stroke(
          prevAngle, prevRadius, curAngle, curRadius,
          size,
          `hsla(${hue}, 85%, 75%, 0.9)`
        );
        ctx.shadowBlur = 0;
      }

      prevAngle  = curAngle;
      prevRadius = curRadius;

      // Centre orb — always pulsing softly
      const orbR = 14 + Math.sin(t * 1.8) * 4;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, orbR + 20);
      cg.addColorStop(0, `hsla(${hue + 60}, 90%, 95%, 0.9)`);
      cg.addColorStop(0.4, `hsla(${hue}, 80%, 65%, 0.5)`);
      cg.addColorStop(1, "transparent");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, orbR + 20, 0, Math.PI * 2);
      ctx.fill();

      // Faint segment guides (help the eye see the symmetry)
      ctx.strokeStyle = "rgba(255,255,255,0.025)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 8]);
      for (let i = 0; i < SEGMENTS; i++) {
        const a = (Math.PI * 2 / SEGMENTS) * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * Math.max(cx, cy) * 1.5, cy + Math.sin(a) * Math.max(cx, cy) * 1.5);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Hint
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Move cursor to paint · double-click to clear", cx, canvas.height - 20);

      raf = requestAnimationFrame(draw);
    }

    function onMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      isMoving = true;
      clearTimeout(moveTimeout);
      moveTimeout = setTimeout(() => { isMoving = false; }, 800);
    }

    function onDbl() {
      fill();
    }

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("dblclick", onDbl);
    window.addEventListener("resize", resize);

    draw();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(moveTimeout);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("dblclick", onDbl);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ cursor: "none", width: "100%", height: "100%" }}
    />
  );
}

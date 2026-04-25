"use client";

import { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  t: number;
  maxR: number;
  hue: number;
  speed: number;
}

export function RipplePool() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    const ripples: Ripple[] = [];
    let hueBase = 200;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Grid of nodes that react to ripples
    const COLS = 40;
    const ROWS = 28;
    const nodes: { x: number; y: number; dy: number; alpha: number }[] = [];

    function buildGrid() {
      nodes.length = 0;
      const gw = canvas.width / COLS;
      const gh = canvas.height / ROWS;
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          nodes.push({ x: c * gw, y: r * gh, dy: 0, alpha: 0 });
        }
      }
    }

    buildGrid();

    function addRipple(x: number, y: number) {
      hueBase = (hueBase + 30) % 360;
      const maxR = Math.max(canvas.width, canvas.height) * 1.2;
      ripples.push({ x, y, t: 0, maxR, hue: hueBase, speed: 280 + Math.random() * 80 });
    }

    // Auto-ripples
    function autoRipple() {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      addRipple(x, y);
      const delay = 800 + Math.random() * 1200;
      setTimeout(autoRipple, delay);
    }
    const autoTimeout = setTimeout(autoRipple, 1200);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Deep background
      ctx.fillStyle = "#000508";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update ripple time
      for (let i = ripples.length - 1; i >= 0; i--) {
        ripples[i].t += 0.016;
        if (ripples[i].t * ripples[i].speed > ripples[i].maxR + 80) {
          ripples.splice(i, 1);
        }
      }

      // Update node displacements
      for (const node of nodes) {
        let totalDy = 0;
        let totalAlpha = 0;
        for (const rip of ripples) {
          const dx = node.x - rip.x;
          const dy = node.y - rip.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const front = rip.t * rip.speed;
          const diff = dist - front;
          const width = 60;
          if (Math.abs(diff) < width) {
            const factor = Math.cos((diff / width) * Math.PI * 0.5);
            const decay = Math.max(0, 1 - front / rip.maxR);
            totalDy += factor * 12 * decay;
            totalAlpha += factor * decay;
          }
        }
        node.dy = totalDy;
        node.alpha = Math.min(1, Math.abs(totalAlpha));
      }

      // Draw ripple circles
      for (const rip of ripples) {
        const r = rip.t * rip.speed;
        const decay = Math.max(0, 1 - r / rip.maxR);

        // Main ring
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(${rip.hue},90%,65%,${0.5 * decay})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner shimmer
        if (r > 20) {
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, r - 14, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${rip.hue + 30},80%,80%,${0.18 * decay})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Origin glow (fades fast)
        const originFade = Math.max(0, 1 - rip.t * 3);
        if (originFade > 0) {
          const g = ctx.createRadialGradient(rip.x, rip.y, 0, rip.x, rip.y, 30);
          g.addColorStop(0, `hsla(${rip.hue},100%,80%,${0.6 * originFade})`);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, 30, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw grid nodes displaced by ripples
      const COLS_N = COLS + 1;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.alpha < 0.02) continue;

        const r = 1.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y + node.dy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100,200,255,${node.alpha * 0.5})`;
        ctx.fill();
      }

      // Hint
      if (ripples.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.font = "14px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Click anywhere to make ripples", canvas.width / 2, canvas.height / 2);
      }

      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Click anywhere · ripples interfere with each other", canvas.width / 2, canvas.height - 28);

      raf = requestAnimationFrame(draw);
    }

    function onClick(e: MouseEvent) {
      addRipple(e.clientX, e.clientY);
    }

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      buildGrid();
    }

    window.addEventListener("resize", onResize);
    canvas.addEventListener("click", onClick);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(autoTimeout);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 cursor-cell"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

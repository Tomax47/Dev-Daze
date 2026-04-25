"use client";

import { useEffect, useRef } from "react";

interface Bubble {
  x: number; y: number; r: number;
  vx: number; vy: number;
  phase: number; hueBase: number;
  alpha: number;
  wobble: number; wobbleSpeed: number;
  hovered: boolean;
}

interface PopRing {
  x: number; y: number;
  r: number; maxR: number;
  alpha: number; hueBase: number;
}

export function SoapBubbles() {
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

    const bubbles: Bubble[]  = [];
    const popRings: PopRing[] = [];
    const mouse = { x: -1, y: -1 };

    function spawnBubble(x?: number, y?: number) {
      const r = 18 + Math.random() * 62;
      bubbles.push({
        x:           x ?? Math.random() * W(),
        y:           y ?? H() + r,
        r,
        vx:          (Math.random() - 0.5) * 0.55,
        vy:          -(0.28 + Math.random() * 0.48),
        phase:       Math.random() * Math.PI * 2,
        hueBase:     Math.random() * 360,
        alpha:       0.48 + Math.random() * 0.38,
        wobble:      Math.random() * Math.PI * 2,
        wobbleSpeed: 0.018 + Math.random() * 0.028,
        hovered:     false,
      });
    }

    for (let i = 0; i < 22; i++) {
      spawnBubble();
      bubbles[bubbles.length - 1].y = Math.random() * H();
    }

    function tryPop(cx: number, cy: number) {
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (Math.hypot(cx - b.x, cy - b.y) <= b.r + 4) {
          popRings.push({ x: b.x, y: b.y, r: b.r * 0.3, maxR: b.r * 3.0, alpha: 0.9, hueBase: b.hueBase });
          bubbles.splice(i, 1);
          return;
        }
      }
    }

    function update() {
      t += 0.01;

      // Pop rings expand and fade
      for (let i = popRings.length - 1; i >= 0; i--) {
        const p = popRings[i];
        p.r    += (p.maxR - p.r) * 0.14;
        p.alpha -= 0.042;
        if (p.alpha <= 0) popRings.splice(i, 1);
      }

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        const dist = Math.hypot(b.x - mouse.x, b.y - mouse.y);
        b.hovered  = dist < b.r + 18;

        // Speed up wobble on hover for anticipation jitter
        b.wobbleSpeed = b.hovered
          ? Math.min(0.09, b.wobbleSpeed + 0.004)
          : Math.max(0.018, b.wobbleSpeed - 0.001);

        b.wobble += b.wobbleSpeed;
        b.vx     += Math.sin(b.wobble) * 0.014;
        b.vx     *= 0.992;
        b.x      += b.vx;
        b.y      += b.vy;
        b.alpha  -= 0.0007;

        if (b.x < b.r)       { b.x = b.r;       b.vx =  Math.abs(b.vx) * 0.5; }
        if (b.x > W() - b.r) { b.x = W() - b.r; b.vx = -Math.abs(b.vx) * 0.5; }

        if (b.y < -b.r * 2 || b.alpha <= 0) bubbles.splice(i, 1);
      }

      while (bubbles.length < 22) spawnBubble();
    }

    function drawBubble(b: Bubble) {
      const { x, y, r, alpha, hovered } = b;

      ctx.save();
      // Slight scale-pulse when hovered
      if (hovered) {
        const pulse = 1 + Math.sin(t * 14 + b.phase) * 0.035;
        ctx.translate(x, y);
        ctx.scale(pulse, pulse);
        ctx.translate(-x, -y);
      }
      ctx.globalAlpha = alpha;

      // Thin-film iridescence (rotating gradient)
      const angle = t * 0.38 + b.phase;
      const cos   = Math.cos(angle), sin = Math.sin(angle);
      const sg    = ctx.createLinearGradient(x + cos * r, y + sin * r, x - cos * r, y - sin * r);
      const h1    = (b.hueBase + t * 22) % 360;
      sg.addColorStop(0,    `hsla(${h1},90%,76%,0.58)`);
      sg.addColorStop(0.35, `hsla(${(h1 + 120) % 360},90%,76%,0.48)`);
      sg.addColorStop(0.65, `hsla(${(h1 + 240) % 360},90%,76%,0.48)`);
      sg.addColorStop(1,    `hsla(${h1},90%,76%,0.58)`);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      // Glass interior
      const ig = ctx.createRadialGradient(x, y, 0, x, y, r);
      ig.addColorStop(0,    "rgba(255,255,255,0.04)");
      ig.addColorStop(0.65, "rgba(200,235,255,0.03)");
      ig.addColorStop(1,    "rgba(150,205,255,0.10)");
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = ig;
      ctx.fill();

      // Rim — brighter when hovered
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.strokeStyle = hovered ? "rgba(230,248,255,0.55)" : "rgba(210,238,255,0.30)";
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Primary specular
      const hlx = x - r * 0.32, hly = y - r * 0.36;
      const hl  = ctx.createRadialGradient(hlx, hly, 0, hlx, hly, r * 0.32);
      hl.addColorStop(0, "rgba(255,255,255,0.85)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(hlx, hly, r * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();

      // Secondary specular
      const h2x = x + r * 0.36, h2y = y + r * 0.28;
      const hl2 = ctx.createRadialGradient(h2x, h2y, 0, h2x, h2y, r * 0.14);
      hl2.addColorStop(0, "rgba(255,255,255,0.40)");
      hl2.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(h2x, h2y, r * 0.14, 0, Math.PI * 2);
      ctx.fillStyle = hl2;
      ctx.fill();

      ctx.restore();
    }

    function drawPopRing(p: PopRing) {
      const h1 = (p.hueBase + t * 22) % 360;
      ctx.save();
      ctx.globalAlpha = p.alpha;

      // Expanding iridescent ring
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${h1},90%,80%,0.9)`;
      ctx.lineWidth   = 2;
      ctx.stroke();

      // Second ring slightly offset
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${(h1 + 120) % 360},88%,78%,0.5)`;
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Radial shimmer fill
      const sg = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, p.r);
      sg.addColorStop(0, `hsla(${(h1 + 60) % 360},90%,85%,${p.alpha * 0.22})`);
      sg.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = sg;
      ctx.fill();

      ctx.restore();
    }

    function render() {
      ctx.clearRect(0, 0, W(), H());

      for (const p of popRings) drawPopRing(p);

      const sorted = [...bubbles].sort((a, b) => b.r - a.r);
      for (const b of sorted) drawBubble(b);

      ctx.fillStyle = "rgba(255,255,255,0.13)";
      ctx.font      = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Click or tap a bubble to pop it", W() / 2, H() - 22);
    }

    function loop() { update(); render(); raf = requestAnimationFrame(loop); }

    const onMove   = (e: MouseEvent)  => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onClick  = (e: MouseEvent)  => { tryPop(e.clientX, e.clientY); };
    const onLeave  = ()               => { mouse.x = -1; mouse.y = -1; };
    const onTouch  = (e: TouchEvent)  => {
      e.preventDefault();
      mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      tryPop(t.clientX, t.clientY);
      mouse.x = -1; mouse.y = -1;
    };
    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };

    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click",      onClick);
    canvas.addEventListener("touchmove",  onTouch,    { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd, { passive: false });
    window.addEventListener("resize",     onResize);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click",      onClick);
      canvas.removeEventListener("touchmove",  onTouch);
      canvas.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("resize",     onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0"
      style={{ width: "100%", height: "100%", cursor: "crosshair" }} />
  );
}

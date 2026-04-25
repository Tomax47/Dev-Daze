"use client";

import { useEffect, useRef } from "react";

const EMBER_COUNT = 65;
const SPARK_MAX   = 130;

interface Ember {
  x: number; y: number;
  glow: number; baseGlow: number; phase: number; r: number;
}

interface Spark {
  x: number; y: number; vx: number; vy: number;
  alpha: number; r: number; hue: number;
}

export function EmberGlow() {
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
    const sparks: Spark[] = [];
    let embers: Ember[]   = [];

    function initEmbers() {
      const bedY = H() * 0.70;
      embers = Array.from({ length: EMBER_COUNT }, () => ({
        x:        20 + Math.random() * (window.innerWidth  - 40),
        y:        bedY + Math.random() * H() * 0.24,
        glow:     Math.random() * 0.35 + 0.08,
        baseGlow: Math.random() * 0.32 + 0.08,
        phase:    Math.random() * Math.PI * 2,
        r:        3.5 + Math.random() * 9,
      }));
    }
    initEmbers();

    function spawnSpark(x: number, y: number) {
      if (sparks.length >= SPARK_MAX) return;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = 0.5 + Math.random() * 2.8;
      sparks.push({
        x, y,
        vx:    Math.cos(angle) * speed,
        vy:    Math.sin(angle) * speed,
        alpha: 0.75 + Math.random() * 0.25,
        r:     0.7 + Math.random() * 1.6,
        hue:   15 + Math.random() * 35,
      });
    }

    function update() {
      t += 0.008;

      for (const e of embers) {
        const breath = 0.5 + 0.5 * Math.sin(t * 1.2 + e.phase);
        const target = e.baseGlow * (0.55 + 0.45 * breath);

        const dx = e.x - mouse.x, dy = e.y - mouse.y;
        const dist  = Math.sqrt(dx * dx + dy * dy);
        const boost = dist < 140 ? (1 - dist / 140) * 1.0 : 0;

        e.glow += (Math.min(1, target + boost) - e.glow) * 0.14;

        if (e.glow > 0.45 && Math.random() < 0.012)
          spawnSpark(e.x + (Math.random() - 0.5) * e.r, e.y - e.r * 0.5);
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx    += (Math.random() - 0.5) * 0.09;
        s.vy    -= 0.018;
        s.x     += s.vx;
        s.y     += s.vy;
        s.alpha -= 0.009;
        if (s.alpha <= 0) sparks.splice(i, 1);
      }
    }

    function render() {
      ctx.clearRect(0, 0, W(), H());

      // Ambient warmth radiating up from the coal bed
      const warmth = 0.028 + 0.012 * Math.sin(t * 0.7);
      const amb    = ctx.createRadialGradient(W() * 0.5, H(), 0, W() * 0.5, H(), H() * 1.1);
      amb.addColorStop(0,   `rgba(180,65,8,${warmth * 3.2})`);
      amb.addColorStop(0.4, `rgba(140,38,4,${warmth})`);
      amb.addColorStop(1,   "transparent");
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, W(), H());

      // Heat shimmer ripples above the bed
      const bedY = H() * 0.70;
      for (let i = 0; i < 7; i++) {
        const sy = bedY - i * H() * 0.038 - Math.sin(t * 2.2 + i * 1.1) * 7;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        for (let x = 0; x <= W(); x += 18) {
          ctx.lineTo(x, sy + Math.sin(x * 0.032 + t * 3.1 + i) * 4.5);
        }
        ctx.lineTo(W(), H()); ctx.lineTo(0, H()); ctx.closePath();
        ctx.fillStyle = `rgba(255,95,18,${0.016 * (1 - i / 7)})`;
        ctx.fill();
      }

      // Ember glows
      ctx.save();
      for (const e of embers) {
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 2.8);
        g.addColorStop(0,   `hsla(${18 + e.glow * 22},100%,${58 + e.glow * 32}%,${e.glow * 0.92})`);
        g.addColorStop(0.4, `hsla(${10 + e.glow * 12}, 90%,38%,${e.glow * 0.48})`);
        g.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * 0.5, 0, Math.PI * 2);
        ctx.fillStyle   = `hsla(${28 + e.glow * 28},100%,${72 + e.glow * 22}%,${e.glow})`;
        ctx.shadowBlur  = 10 * e.glow;
        ctx.shadowColor = "hsla(22,100%,62%,0.8)";
        ctx.fill();
        ctx.shadowBlur  = 0;
      }
      ctx.restore();

      // Sparks
      ctx.save();
      for (const s of sparks) {
        ctx.globalAlpha  = s.alpha;
        ctx.shadowBlur   = 7;
        ctx.shadowColor  = `hsl(${s.hue},100%,68%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${s.hue + 28},100%,82%)`;
        ctx.fill();
      }
      ctx.restore();

      // Cursor glow near coal bed
      if (mouse.x > -900) {
        const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 70);
        cg.addColorStop(0, "rgba(255,110,20,0.18)");
        cg.addColorStop(1, "transparent");
        ctx.fillStyle = cg;
        ctx.fillRect(mouse.x - 70, mouse.y - 70, 140, 140);
      }

      // Vignette
      const vig = ctx.createRadialGradient(W() * 0.5, H() * 0.38, H() * 0.08, W() * 0.5, H() * 0.38, H() * 0.92);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0,0,0,0.58)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W(), H());

      ctx.fillStyle = "rgba(255,195,90,0.17)";
      ctx.font      = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Move near the embers · click to ignite", W() / 2, H() - 22);
    }

    function loop() { update(); render(); raf = requestAnimationFrame(loop); }

    function burstAt(x: number, y: number) {
      for (let i = 0; i < 28; i++) spawnSpark(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 20);
      // Also flare nearby embers instantly
      for (const e of embers) {
        const dist = Math.hypot(e.x - x, e.y - y);
        if (dist < 150) e.glow = Math.min(1, e.glow + (1 - dist / 150) * 0.8);
      }
    }

    const onMove  = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = ()              => { mouse.x = -999; mouse.y = -999; };
    const onClick = (e: MouseEvent) => { burstAt(e.clientX, e.clientY); };
    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    };
    const onTouchTap = (e: TouchEvent) => {
      e.preventDefault();
      burstAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    };
    const onResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      initEmbers();
    };

    canvas.addEventListener("mousemove",  onMove);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("click",      onClick);
    canvas.addEventListener("touchmove",  onTouch,    { passive: false });
    canvas.addEventListener("touchend",   onTouchTap, { passive: false });
    window.addEventListener("resize",     onResize);
    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove",  onMove);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("click",      onClick);
      canvas.removeEventListener("touchmove",  onTouch);
      canvas.removeEventListener("touchend",   onTouchTap);
      window.removeEventListener("resize",     onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0"
      style={{ width: "100%", height: "100%", cursor: "none" }} />
  );
}

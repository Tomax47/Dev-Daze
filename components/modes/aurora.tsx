"use client";

import { useEffect, useRef } from "react";

const N        = 128;    // surface nodes
const FILL     = 0.48;   // fraction of screen height filled with liquid
const DAMP     = 0.9988; // energy decay per physics step
const MAX_TILT = 0.78;   // ~45 degrees

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function GravityLiquid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let raf: number;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = () => canvas.width;
    const H = () => canvas.height;

    // Height-field: displacement (px) from tilt-adjusted equilibrium
    const disp = new Float32Array(N);
    const vvel = new Float32Array(N);

    let tilt       = 0.0;
    let tiltTarget = 0.0;
    let prevTilt   = 0.0;
    let hasGyro    = false;

    function restY(i: number, ang: number): number {
      const x = i / (N - 1) - 0.5;
      return H() * (1 - FILL) - x * W() * Math.tan(ang);
    }

    function surfY(i: number): number {
      return restY(i, tilt) + disp[i];
    }

    // When tilt changes, shift displacement so the visible surface is continuous
    function commitTilt(newTilt: number) {
      for (let i = 0; i < N; i++) {
        disp[i] += restY(i, prevTilt) - restY(i, newTilt);
      }
      prevTilt = newTilt;
    }

    function simulate(dt: number) {
      const newTilt = tilt + (tiltTarget - tilt) * 0.06;
      if (Math.abs(newTilt - tilt) > 2e-4) {
        commitTilt(newTilt);
        tilt = newTilt;
      }

      const dt_cap = Math.min(dt, 1 / 60);
      const dx     = W() / (N - 1);
      const c2     = (W() / 4) ** 2; // CFL-safe wave speed

      for (let i = 0; i < N; i++) {
        const l   = disp[i > 0     ? i - 1 : 0];
        const r   = disp[i < N - 1 ? i + 1 : N - 1];
        const lap = (l - 2 * disp[i] + r) / (dx * dx);
        vvel[i] = (vvel[i] + dt_cap * c2 * lap) * DAMP;
      }
      for (let i = 0; i < N; i++) {
        disp[i] += dt_cap * vvel[i];
        // Clamp surface to screen
        const abs = restY(i, tilt) + disp[i];
        if (abs < 4)       { disp[i] = 4       - restY(i, tilt); vvel[i] *= -0.2; }
        if (abs > H() - 4) { disp[i] = H() - 4 - restY(i, tilt); vvel[i] *= -0.2; }
      }
    }

    // Moving caustic blobs (light refraction inside liquid)
    const caustics = Array.from({ length: 16 }, (_, k) => ({
      xr:    0.05 + (k / 15) * 0.90,
      yr:    0.12 + Math.random() * 0.72,
      rad:   32 + Math.random() * 52,
      spd:   0.18 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));

    interface Foam { x: number; y: number; vx: number; vy: number; r: number; life: number }
    const foam: Foam[] = [];

    function splash(cx: number) {
      const xi = Math.round((cx / W()) * (N - 1));
      for (let d = -14; d <= 14; d++) {
        const j = clamp(xi + d, 0, N - 1);
        vvel[j] += -H() * 0.07 * Math.exp(-(d * d) / 22);
      }
      for (let k = 0; k < 8; k++) {
        foam.push({
          x:    cx + (Math.random() - 0.5) * 30,
          y:    surfY(xi),
          vx:   (Math.random() - 0.5) * 90,
          vy:   -(20 + Math.random() * 80),
          r:    0.8 + Math.random() * 2.2,
          life: 0.5 + Math.random() * 0.5,
        });
      }
    }

    // Draws the surface curve; caller sets up beginPath + moveTo first
    function traceSurface(sy: Float32Array, W_: number) {
      for (let i = 1; i < N; i++) {
        const x0 = ((i - 1) / (N - 1)) * W_;
        const x1 = (i       / (N - 1)) * W_;
        ctx.quadraticCurveTo(x0, sy[i - 1], (x0 + x1) / 2, (sy[i - 1] + sy[i]) / 2);
      }
      ctx.lineTo(W_, sy[N - 1]);
    }

    let t      = 0;
    let lastMs = performance.now();

    function render() {
      const W_ = W(), H_ = H();
      ctx.clearRect(0, 0, W_, H_);

      // Background
      ctx.fillStyle = "#040810";
      ctx.fillRect(0, 0, W_, H_);

      const sy    = Float32Array.from({ length: N }, (_, i) => surfY(i));
      const minSY = Math.min(...Array.from(sy));

      // --- Liquid body ---
      ctx.beginPath();
      ctx.moveTo(0, H_);
      ctx.lineTo(0, sy[0]);
      traceSurface(sy, W_);
      ctx.lineTo(W_, H_);
      ctx.closePath();

      const lg = ctx.createLinearGradient(0, minSY, 0, H_);
      lg.addColorStop(0,    "rgba(90,  210, 255, 0.88)");
      lg.addColorStop(0.10, "rgba(30,  120, 220, 0.93)");
      lg.addColorStop(0.40, "rgba(8,   50,  130, 0.97)");
      lg.addColorStop(1,    "rgba(2,   15,  50,  1.00)");
      ctx.fillStyle = lg;
      ctx.fill();

      // --- Caustics (clipped to liquid) ---
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, H_);
      ctx.lineTo(0, sy[0]);
      traceSurface(sy, W_);
      ctx.lineTo(W_, H_);
      ctx.closePath();
      ctx.clip();
      ctx.globalCompositeOperation = "screen";

      for (const c of caustics) {
        const surfAtX = sy[Math.round(c.xr * (N - 1))];
        const cx  = c.xr * W_ + Math.sin(t * c.spd + c.phase) * 36;
        const cy  = surfAtX + (H_ - surfAtX) * c.yr
                    + Math.cos(t * c.spd * 0.65 + c.phase + 1.3) * 18;
        const rg  = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.rad);
        rg.addColorStop(0,   "rgba(70, 190, 255, 0.13)");
        rg.addColorStop(0.6, "rgba(40, 130, 210, 0.06)");
        rg.addColorStop(1,   "transparent");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, c.rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- Surface-curvature specular glints ---
      for (let i = 1; i < N - 1; i++) {
        const curv = sy[i - 1] - 2 * sy[i] + sy[i + 1];
        if (curv > 0.35) {
          const x = (i / (N - 1)) * W_;
          const a = Math.min(0.42, curv * 0.11);
          const sg = ctx.createRadialGradient(x, sy[i], 0, x, sy[i], 12);
          sg.addColorStop(0, `rgba(210, 248, 255, ${a})`);
          sg.addColorStop(1, "transparent");
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(x, sy[i], 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // --- Surface glow ---
      ctx.beginPath();
      ctx.moveTo(0, sy[0]);
      traceSurface(sy, W_);
      ctx.strokeStyle = "rgba(190, 240, 255, 0.55)";
      ctx.lineWidth   = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, sy[0]);
      traceSurface(sy, W_);
      ctx.strokeStyle = "rgba(240, 252, 255, 0.28)";
      ctx.lineWidth   = 1;
      ctx.stroke();

      // --- Foam ---
      for (const f of foam) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(210, 248, 255, ${f.life * 0.75})`;
        ctx.fill();
      }

      // --- Hint ---
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.font      = "13px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        hasGyro ? "Tilt to slosh · tap to splash" : "Move mouse to tilt · click to splash",
        W_ / 2, H_ - 22,
      );
    }

    function loop(now: number) {
      const dt = Math.min((now - lastMs) / 1000, 0.05);
      lastMs = now;
      t += dt;

      simulate(dt);

      for (let i = foam.length - 1; i >= 0; i--) {
        const f = foam[i];
        f.x    += f.vx * dt;
        f.y    += f.vy * dt;
        f.vy   += 200 * dt;
        f.life -= dt * 1.5;
        if (f.life <= 0) foam.splice(i, 1);
      }

      render();
      raf = requestAnimationFrame(loop);
    }

    // === Events ===

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      hasGyro = true;
      tiltTarget = clamp((e.gamma * Math.PI) / 180, -MAX_TILT, MAX_TILT);
    };

    const onMouseMove  = (e: MouseEvent) => {
      if (!hasGyro) tiltTarget = clamp(((e.clientX / W()) - 0.5) * 2.2, -MAX_TILT, MAX_TILT);
    };
    const onMouseLeave = () => { if (!hasGyro) tiltTarget = 0; };
    const onClick      = (e: MouseEvent) => splash(e.clientX);

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(t => splash(t.clientX));
    };
    const onTouchMove  = (e: TouchEvent) => { e.preventDefault(); };
    const onResize     = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      disp.fill(0);
      vvel.fill(0);
    };

    // iOS 13+ requires explicit permission for DeviceOrientationEvent
    type DOEwithPerm = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof (DeviceOrientationEvent as DOEwithPerm).requestPermission === "function") {
      const reqPerm = async () => {
        try {
          const r = await (DeviceOrientationEvent as DOEwithPerm).requestPermission!();
          if (r === "granted") window.addEventListener("deviceorientation", onOrientation);
        } catch { /* denied */ }
      };
      canvas.addEventListener("touchstart", reqPerm, { once: true });
      canvas.addEventListener("click",      reqPerm, { once: true });
    } else {
      window.addEventListener("deviceorientation", onOrientation);
    }

    canvas.addEventListener("mousemove",  onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("click",      onClick);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    window.addEventListener("resize",     onResize);

    raf = requestAnimationFrame((now) => { lastMs = now; loop(now); });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("resize",            onResize);
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("click",      onClick);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width: "100%", height: "100%", cursor: "crosshair" }}
    />
  );
}

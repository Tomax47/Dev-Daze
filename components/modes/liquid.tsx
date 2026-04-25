"use client";

import { useEffect, useRef } from "react";

const NODES  = 220;
const K      = 0.018;
const DAMP   = 0.975;
const SPREAD = 0.14;
const GRAV   = 0.55;   // air gravity
const WGRAV  = 0.20;   // net gravity in water (gravity − buoyancy for dense brick)
const WDRAG  = 0.88;   // velocity multiplier per frame underwater

interface Drop   { x:number;y:number;vx:number;vy:number;r:number;alpha:number;hue:number }
interface Ring   { x:number;sy:number;rx:number;ry:number;alpha:number;hue:number }
interface Bubble { x:number;y:number;vx:number;vy:number;r:number;alpha:number }
interface Brick  {
  x:number; y:number; vx:number; vy:number;
  w:number; h:number; angle:number; av:number;
  splashed:boolean; color:string;
}

const BRICK_FACES = ["#b03a2e","#96281b","#c0392b","#a93226","#cb4335"];
const MORTAR      = "#e8c9b8";

export function Liquid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    let raf: number;

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const W    = () => canvas.width;
    const H    = () => canvas.height;
    const REST = () => H() * 0.50;

    let nodes: { y:number; vy:number }[] = [];
    const drops:   Drop[]   = [];
    const rings:   Ring[]   = [];
    const bubbles: Bubble[] = [];
    const bricks:  Brick[]  = [];

    let hue = 195, t = 0;

    const stars = Array.from({ length: 130 }, () => ({
      x: Math.random(), y: Math.random() * 0.46,
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.55 + 0.2,
    }));

    function initNodes() {
      nodes = Array.from({ length: NODES }, () => ({ y: REST(), vy: 0 }));
    }
    initNodes();

    /* ── Surface interpolation ── */
    function surfaceY(x: number) {
      const f  = Math.max(0, Math.min(1, x / W()));
      const fi = f * (NODES - 1);
      const i0 = Math.floor(fi);
      const i1 = Math.min(NODES - 1, i0 + 1);
      return nodes[i0].y * (1 - (fi - i0)) + nodes[i1].y * (fi - i0);
    }

    /* ── Physically accurate splash ── */
    function splash(bx: number, bw: number, impactVy: number) {
      const strength     = Math.min(45, impactVy * 0.55 + bw * 0.30);
      const nodeSpacing  = W() / NODES;
      const halfBrick    = Math.ceil((bw / 2) / nodeSpacing);
      const outerCrown   = halfBrick + 10;
      const ni           = Math.round((bx / W()) * NODES);

      // ① Cavity under brick (push DOWN) + crown ring (push UP just outside)
      for (let i = Math.max(0, ni - outerCrown); i < Math.min(NODES, ni + outerCrown); i++) {
        const dist = Math.abs(i - ni);
        if (dist <= halfBrick) {
          // Direct impact zone — depress the surface
          nodes[i].vy += strength * 0.95 * (1 - dist / Math.max(1, halfBrick));
        } else {
          // Crown precursor — slight upward kick just outside impact
          const od = dist - halfBrick;
          nodes[i].vy -= strength * 0.22 * Math.max(0, 1 - od / 10);
        }
      }

      const sy   = surfaceY(bx);
      const half = bw / 2;

      // ② Crown spray — shoots from the two outer edges of the impact zone
      const crownCount = Math.floor(strength * 1.1);
      for (let side = -1; side <= 1; side += 2) {
        for (let j = 0; j < crownCount; j++) {
          // Angle fans outward from each edge: upper-left fan or upper-right fan
          const baseAngle = side < 0 ? -Math.PI * 0.78 : -Math.PI * 0.22;
          const angle     = baseAngle + (Math.random() - 0.5) * 1.1;
          const spd       = Math.random() * strength * 0.95 + 3.5;
          drops.push({
            x: bx + side * (half * (0.5 + Math.random() * 0.7)),
            y: sy,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd,
            r: Math.random() * 3.5 + 1.5,
            alpha: 0.85 + Math.random() * 0.15,
            hue: hue + (Math.random() - 0.5) * 30,
          });
        }
      }

      // ③ Worthington jet — thin central column shooting straight up
      const jetCount = Math.floor(strength * 0.28);
      for (let j = 0; j < jetCount; j++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.35;
        const spd   = strength * 0.85 + Math.random() * 3;
        drops.push({
          x:     bx + (Math.random() - 0.5) * 8,
          y:     sy,
          vx:    Math.cos(angle) * spd,
          vy:    Math.sin(angle) * spd,
          r:     Math.random() * 2 + 1,
          alpha: 0.92,
          hue:   hue + 15,
        });
      }

      // ④ Impact rings — start from brick half-width for realism
      rings.push({ x: bx, sy, rx: half,        ry: half * 0.25, alpha: 0.95, hue });
      rings.push({ x: bx, sy, rx: half * 0.55, ry: half * 0.14, alpha: 0.65, hue });
      rings.push({ x: bx, sy, rx: 4,           ry: 1,           alpha: 0.40, hue });

      // ⑤ Air bubbles trapped by the impact
      const bubbleCount = Math.floor(strength * 0.5);
      for (let j = 0; j < bubbleCount; j++) {
        bubbles.push({
          x: bx + (Math.random() - 0.5) * bw * 0.8,
          y: sy + Math.random() * 20,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -(Math.random() * 1.2 + 0.4),
          r: Math.random() * 3 + 1,
          alpha: 0.45 + Math.random() * 0.35,
        });
      }
    }

    /* ── Throw a brick ── */
    function throwBrick(x: number, y: number) {
      const w = 18 + Math.random() * 110;
      bricks.push({
        x, y,
        vx: (Math.random() - 0.5) * 2.5,
        vy: 2 + Math.random(),
        w, h: w * 0.44,
        angle: (Math.random() - 0.5) * 0.5,
        av:    (Math.random() - 0.5) * 0.10,
        splashed: false,
        color: BRICK_FACES[Math.floor(Math.random() * BRICK_FACES.length)],
      });
    }

    /* ── Draw brick (above or below water) ── */
    function drawBrick(b: Brick, underwater: boolean) {
      const sy       = surfaceY(b.x);
      const depth    = Math.max(0, b.y - sy);
      const maxDepth = Math.max(1, H() - sy);
      const depthFrac = Math.min(1, depth / maxDepth);

      // Slight horizontal wobble from water refraction
      const wobble = underwater ? Math.sin(t * 7 + b.y * 0.04) * Math.min(4, depth * 0.025) : 0;

      ctx.save();
      if (underwater) {
        // Dims and desaturates with depth; blurs very gently
        const bright  = 0.65 - depthFrac * 0.45;
        const blurPx  = Math.min(2.5, depthFrac * 4);
        ctx.globalAlpha = Math.max(0.06, 0.9 - depthFrac * 0.8);
        ctx.filter = `brightness(${bright}) saturate(${0.7 - depthFrac * 0.4}) blur(${blurPx}px)`;
      }

      ctx.translate(b.x + wobble, b.y);
      ctx.rotate(b.angle);

      const hw = b.w / 2, hh = b.h / 2;

      // Body
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(-hw, -hh, b.w, b.h, 3);
      ctx.fill();

      // Mortar lines
      const prevFilter = ctx.filter;
      ctx.filter = "none";
      ctx.strokeStyle = MORTAR;
      ctx.globalAlpha *= 0.5;
      ctx.lineWidth = 1.2;

      // Horizontal mid-seam
      ctx.beginPath();
      ctx.moveTo(-hw + 4, 0);
      ctx.lineTo(hw - 4, 0);
      ctx.stroke();

      // Vertical seams (staggered like real brickwork)
      for (const tx of [-hw + b.w * 0.33, -hw + b.w * 0.66]) {
        ctx.beginPath(); ctx.moveTo(tx, -hh + 3); ctx.lineTo(tx, -2); ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-hw + b.w * 0.5, 2);
      ctx.lineTo(-hw + b.w * 0.5, hh - 3);
      ctx.stroke();

      // Highlight edge
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-hw + 3, hh - 3);
      ctx.lineTo(-hw + 3, -hh + 3);
      ctx.lineTo(hw - 3, -hh + 3);
      ctx.stroke();

      ctx.restore();
    }

    /* ── Physics ── */
    function update() {
      const rest = REST();

      // Water spring
      for (let i = 0; i < NODES; i++) {
        nodes[i].vy -= K * (nodes[i].y - rest);
        nodes[i].vy *= DAMP;
        nodes[i].y  += nodes[i].vy;
      }
      for (let p = 0; p < 2; p++) {
        for (let i = 1; i < NODES - 1; i++) {
          nodes[i-1].vy += SPREAD * (nodes[i].y - nodes[i-1].y);
          nodes[i+1].vy += SPREAD * (nodes[i].y - nodes[i+1].y);
        }
      }

      // Bricks
      for (let i = bricks.length - 1; i >= 0; i--) {
        const b = bricks[i];
        if (!b.splashed) {
          // Free fall in air
          b.vy    += GRAV;
          b.vx    *= 0.998;
          b.x     += b.vx;
          b.y     += b.vy;
          b.angle += b.av;

          if (b.y + b.h / 2 >= surfaceY(b.x)) {
            b.splashed = true;
            splash(b.x, b.w, b.vy);
            // Kill spin immediately on impact (water kills rotation fast)
            b.av *= 0.1;
          }
        } else {
          // Underwater: drag + reduced net gravity + angular damping
          b.vx *= WDRAG;
          b.vy  = b.vy * WDRAG + WGRAV;
          b.av *= 0.90;
          b.angle += b.av;
          b.x     += b.vx;
          b.y     += b.vy;
        }

        if (b.y > H() + 300) bricks.splice(i, 1);
      }

      // Drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy    += GRAV * 0.75;
        d.vx    *= 0.993;
        d.x     += d.vx;
        d.y     += d.vy;
        d.alpha -= 0.008;

        const sy = surfaceY(d.x);
        if (d.y >= sy && d.vy > 0) {
          const ni = Math.round((d.x / W()) * NODES);
          if (ni >= 0 && ni < NODES) nodes[ni].vy += d.vy * 0.30;
          rings.push({ x: d.x, sy, rx: 1, ry: 0.3, alpha: 0.35, hue: d.hue });
          drops.splice(i, 1); continue;
        }
        if (d.alpha <= 0 || d.x < -40 || d.x > W() + 40) drops.splice(i, 1);
      }

      // Rings expand
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].rx    += 5;
        rings[i].ry    += 5 * 0.27;
        rings[i].alpha -= 0.020;
        if (rings[i].alpha <= 0) rings.splice(i, 1);
      }

      // Bubbles rise
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.x     += b.vx;
        b.y     += b.vy;
        b.alpha -= 0.006;
        const sy = surfaceY(b.x);
        if (b.y <= sy || b.alpha <= 0) { bubbles.splice(i, 1); }
      }
    }

    /* ── Render ── */
    function drawSurface() {
      ctx.beginPath();
      ctx.moveTo(0, nodes[0].y);
      for (let i = 0; i < NODES - 1; i++) {
        const x0 = (i / NODES) * W();
        const xm = ((i + 0.5) / NODES) * W();
        const ym = (nodes[i].y + nodes[i+1].y) / 2;
        ctx.quadraticCurveTo(x0, nodes[i].y, xm, ym);
      }
      ctx.lineTo(W(), nodes[NODES-1].y);
    }

    function render() {
      t   += 0.008;
      hue  = 188 + Math.sin(t * 0.25) * 22;

      ctx.clearRect(0, 0, W(), H());

      // Stars
      for (const s of stars) {
        const px = s.x * W(), py = s.y * H();
        if (py < surfaceY(px) - 4) {
          ctx.beginPath(); ctx.arc(px, py, s.r, 0, Math.PI*2);
          ctx.fillStyle = `rgba(255,255,255,${s.a})`; ctx.fill();
        }
      }

      // Moon
      const mx = W()*0.78, my = H()*0.14;
      const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
      mg.addColorStop(0, "rgba(220,230,255,0.18)"); mg.addColorStop(1, "transparent");
      ctx.fillStyle = mg; ctx.fillRect(mx-90, my-90, 180, 180);
      ctx.beginPath(); ctx.arc(mx, my, 22, 0, Math.PI*2);
      ctx.fillStyle = "#d8e4ff"; ctx.fill();

      // Bricks above water
      for (const b of bricks) if (!b.splashed) drawBrick(b, false);

      // Water + underwater content
      ctx.save();
      drawSurface();
      ctx.lineTo(W(), H()); ctx.lineTo(0, H()); ctx.closePath(); ctx.clip();

      // Moon shimmer column
      const col = ctx.createLinearGradient(mx-30, 0, mx+30, 0);
      col.addColorStop(0, "transparent");
      col.addColorStop(0.5, `rgba(180,210,255,${0.10+Math.sin(t*3.1)*0.03})`);
      col.addColorStop(1, "transparent");
      ctx.fillStyle = col; ctx.fillRect(0, 0, W(), H());

      // Water gradient
      const water = ctx.createLinearGradient(0, REST(), 0, H());
      water.addColorStop(0,    `hsla(${hue},75%,32%,0.70)`);
      water.addColorStop(0.35, `hsla(${hue},70%,18%,0.88)`);
      water.addColorStop(1,    `hsla(${hue+15},55%,7%,0.99)`);
      ctx.fillStyle = water; ctx.fillRect(0, 0, W(), H());

      // Sunken bricks (inside clip → hidden below surface automatically)
      for (const b of bricks) if (b.splashed) drawBrick(b, true);

      // Bubbles rising through water
      ctx.save();
      for (const b of bubbles) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
        ctx.strokeStyle = `rgba(180,220,255,${b.alpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();

      ctx.restore(); // end water clip

      // Surface glow
      ctx.save();
      ctx.shadowBlur = 22; ctx.shadowColor = `hsla(${hue},90%,72%,0.75)`;
      drawSurface();
      ctx.strokeStyle = `hsla(${hue},88%,78%,0.85)`; ctx.lineWidth = 2.5; ctx.stroke();
      ctx.restore();

      // Rings
      for (const r of rings) {
        ctx.beginPath();
        ctx.ellipse(r.x, r.sy, r.rx, r.ry, 0, 0, Math.PI*2);
        ctx.strokeStyle = `hsla(${r.hue},80%,82%,${r.alpha})`;
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Drops
      ctx.save(); ctx.shadowBlur = 12;
      for (const d of drops) {
        ctx.shadowColor = `hsla(${d.hue},90%,80%,0.8)`;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${d.hue},90%,88%,${d.alpha})`; ctx.fill();
      }
      ctx.restore();

      // Hint
      ctx.fillStyle = "rgba(255,255,255,0.13)";
      ctx.font = "13px system-ui"; ctx.textAlign = "center";
      ctx.fillText("Click to throw a brick", W()/2, H()-22);
    }

    /* ── Main loop ── */
    function loop() {
      update();
      render();
      raf = requestAnimationFrame(loop);
    }

    const onClick  = (e:MouseEvent) => throwBrick(e.clientX, e.clientY);
    const onResize = ()             => { canvas.width=window.innerWidth; canvas.height=window.innerHeight; initNodes(); };

    canvas.addEventListener("click",  onClick);
    window.addEventListener("resize", onResize);

    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("click",  onClick);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0"
      style={{ cursor:"crosshair", width:"100%", height:"100%" }} />
  );
}

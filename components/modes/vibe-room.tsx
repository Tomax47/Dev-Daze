"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MESSAGES = [
  "Pure Bliss", "Maximum Zen", "Cosmic Energy", "Total Serenity",
  "Infinite Peace", "Groovy Vibes", "Ultra Chill", "Ascended",
  "Beyond Reality", "Frequency Locked", "Vibrational High", "Unlocked",
];

const HUES = [260, 200, 320, 160, 30, 290, 180, 50];

interface Burst {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface FloatText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export function VibeRoom() {
  const [count, setCount] = useState(0);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [floats, setFloats] = useState<FloatText[]>([]);
  const [pressing, setPressing] = useState(false);
  const [bgHue, setBgHue] = useState(260);
  const idRef = useRef(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; r: number; alpha: number; hue: number }[]>([]);
  const rafRef = useRef<number>(0);

  // Background canvas particle field
  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.3 + 0.1,
      hue: bgHue,
    }));

    function tick() {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const p of particlesRef.current) {
        p.hue = bgHue + Math.sin(Date.now() * 0.001) * 20;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,70%,${p.alpha})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();

    function onResize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Keep bgHue synced into canvas particles
  useEffect(() => {
    for (const p of particlesRef.current) {
      p.hue = bgHue;
    }
  }, [bgHue]);

  const fireConfetti = useCallback(async (x: number, y: number, hue: number) => {
    const confetti = (await import("canvas-confetti")).default;
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { x: x / window.innerWidth, y: y / window.innerHeight },
      colors: [
        `hsl(${hue},90%,65%)`,
        `hsl(${hue + 40},90%,70%)`,
        `hsl(${hue - 40},90%,60%)`,
        "#fff",
      ],
      scalar: 1.3,
      shapes: ["star", "circle"],
      ticks: 200,
    });
  }, []);

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      const newCount = count + 1;
      setCount(newCount);
      setPressing(true);
      setTimeout(() => setPressing(false), 120);

      const hue = HUES[(newCount - 1) % HUES.length];
      setBgHue(hue);

      const id = ++idRef.current;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const bx = rect.left + rect.width / 2;
      const by = rect.top + rect.height / 2;

      // Ripple burst
      setBursts((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, color: `hsl(${hue},90%,70%)` }]);
      setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 800);

      // Float text
      const fid = ++idRef.current;
      setFloats((prev) => [
        ...prev,
        {
          id: fid,
          x: 20 + Math.random() * 60,
          y: -20 - Math.random() * 40,
          text: MESSAGES[(newCount - 1) % MESSAGES.length],
          color: `hsl(${hue},90%,75%)`,
        },
      ]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== fid)), 1600);

      await fireConfetti(bx, by, hue);
    },
    [count, fireConfetti]
  );

  const btnHue = HUES[(count) % HUES.length];
  const currentMsg = count === 0 ? "Click me" : MESSAGES[(count - 1) % MESSAGES.length];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, hsla(${btnHue},80%,20%,0.35), transparent)`,
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-2 mb-12"
        animate={{ scale: pressing ? 1.06 : 1 }}
        transition={{ duration: 0.1 }}
      >
        <div className="text-xs tracking-[0.3em] uppercase text-white/30 font-medium">Vibe Counter</div>
        <motion.div
          key={count}
          initial={{ scale: 1.5, opacity: 0, y: -10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-[7rem] font-black leading-none"
          style={{
            background: `linear-gradient(135deg, hsl(${btnHue},90%,75%), hsl(${btnHue + 60},90%,70%))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {count}
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMsg}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm tracking-widest uppercase font-medium"
            style={{ color: `hsl(${btnHue},80%,70%)` }}
          >
            {currentMsg}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="relative z-10">
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div
              key={f.id}
              className="absolute pointer-events-none text-xs font-bold tracking-widest uppercase whitespace-nowrap z-20"
              style={{ left: `${f.x}%`, bottom: "100%", color: f.color }}
              initial={{ opacity: 1, y: 0, scale: 1 }}
              animate={{ opacity: 0, y: f.y, scale: 0.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: "easeOut" }}
            >
              {f.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {pressing && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ borderColor: `hsl(${btnHue},90%,65%)`, borderWidth: 2, borderStyle: "solid" }}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 3 + i * 0.8, opacity: 0 }}
                transition={{ duration: 0.8, delay: i * 0.12, ease: "easeOut" }}
              />
            ))}
          </>
        )}

        <button
          ref={btnRef}
          onClick={handleClick}
          className="relative overflow-hidden select-none"
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: `linear-gradient(135deg, hsl(${btnHue},90%,45%), hsl(${btnHue + 60},80%,40%))`,
            boxShadow: pressing
              ? `0 0 20px hsla(${btnHue},90%,60%,0.4), inset 0 2px 4px rgba(0,0,0,0.3)`
              : `0 0 60px hsla(${btnHue},90%,60%,0.5), 0 0 120px hsla(${btnHue},90%,50%,0.2), inset 0 1px 0 rgba(255,255,255,0.2)`,
            transform: pressing ? "scale(0.93)" : "scale(1)",
            transition: "transform 0.1s, box-shadow 0.3s, background 0.7s",
          }}
        >
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)",
              backgroundSize: "200% 100%",
              animation: "shimmer-btn 2.5s linear infinite",
            }}
          />

          {bursts.map((b) => (
            <motion.div
              key={b.id}
              className="absolute rounded-full pointer-events-none"
              style={{ left: b.x, top: b.y, backgroundColor: b.color, translateX: "-50%", translateY: "-50%" }}
              initial={{ width: 0, height: 0, opacity: 0.7 }}
              animate={{ width: 300, height: 300, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ))}

          <span className="relative z-10 flex flex-col items-center gap-1 text-white font-black">
            <span className="text-3xl">⚡</span>
            <span className="text-sm tracking-wider">VIBE</span>
          </span>
        </button>
      </div>

      <div className="relative z-10 mt-10 text-white/20 text-xs tracking-widest uppercase">
        Every click shifts reality
      </div>
    </div>
  );
}

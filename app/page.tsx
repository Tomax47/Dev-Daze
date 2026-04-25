"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MenuBar, type MenuBarItem } from "@/components/ui/bottom-menu";
import { GridPixelateBg } from "@/components/ui/grid-pixelate-bg";
import {
  HomeNavIcon, NebulaIcon, BlackHoleIcon, RippleIcon, GravityIcon,
  LavaLampIcon, SandIcon, KaleidoscopeIcon, LiquidIcon, VibeIcon,
} from "@/components/ui/mode-icons";
import { ParticleNebula } from "@/components/modes/particle-nebula";
import { BlackHole } from "@/components/modes/black-hole";
import { RipplePool } from "@/components/modes/ripple-pool";
import { VibeRoom } from "@/components/modes/vibe-room";
import { GravityDojo } from "@/components/modes/gravity-dojo";
import { LavaLamp } from "@/components/modes/lava-lamp";
import { SandFall } from "@/components/modes/sand-fall";
import { Kaleidoscope } from "@/components/modes/kaleidoscope";
import { Liquid } from "@/components/modes/liquid";

type Mode = "nebula" | "blackhole" | "ripple" | "gravity" | "lavalamp" | "sand" | "kaleidoscope" | "liquid" | "vibe";

const SCREENS: Record<Mode, React.ReactNode> = {
  nebula:       <ParticleNebula />,
  blackhole:    <BlackHole />,
  ripple:       <RipplePool />,
  gravity:      <GravityDojo />,
  lavalamp:     <LavaLamp />,
  sand:         <SandFall />,
  kaleidoscope: <Kaleidoscope />,
  liquid:       <Liquid />,
  vibe:         <VibeRoom />,
};

const MODES: { id: Mode; label: string }[] = [
  { id: "nebula",       label: "Nebula"       },
  { id: "blackhole",    label: "Black Hole"   },
  { id: "ripple",       label: "Ripple"       },
  { id: "gravity",      label: "Gravity"      },
  { id: "lavalamp",     label: "Lava Lamp"    },
  { id: "sand",         label: "Sand"         },
  { id: "kaleidoscope", label: "Kaleidoscope" },
  { id: "liquid",       label: "Liquid"       },
  { id: "vibe",         label: "Vibe"         },
];

const MODE_ICONS: Record<Mode, (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element> = {
  nebula:       (p) => <NebulaIcon {...p} />,
  blackhole:    (p) => <BlackHoleIcon {...p} />,
  ripple:       (p) => <RippleIcon {...p} />,
  gravity:      (p) => <GravityIcon {...p} />,
  lavalamp:     (p) => <LavaLampIcon {...p} />,
  sand:         (p) => <SandIcon {...p} />,
  kaleidoscope: (p) => <KaleidoscopeIcon {...p} />,
  liquid:       (p) => <LiquidIcon {...p} />,
  vibe:         (p) => <VibeIcon {...p} />,
};

function Landing() {
  return (
    <motion.div
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      <GridPixelateBg />

      {/* hero content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          textAlign: "center",
          padding: "0 24px",
          zIndex: 10,
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "var(--font-lilita-one), sans-serif",
            fontSize: "clamp(62px, 12vw, 144px)",
            lineHeight: 0.9,
            color: "#fff",
            letterSpacing: "-0.01em",
            userSelect: "none",
          }}
        >
          Dev Daze
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontSize: "clamp(12px, 1.5vw, 16px)",
            color: "rgba(255,255,255,0.36)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Interactive Zen Playground
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.9 }}
          style={{
            marginTop: 6,
            fontSize: "clamp(11px, 1.2vw, 13px)",
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.07em",
          }}
        >
          pick a vibe from the dock below
        </motion.p>
      </div>

      {/* footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: 76,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", letterSpacing: "0.1em" }}>
          © 2025 Dev Daze
        </span>
        <span style={{ width: 1, height: 9, background: "rgba(255,255,255,0.1)" }} />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.16)", letterSpacing: "0.06em" }}>
          9 modes · infinite vibes
        </span>
      </motion.footer>
    </motion.div>
  );
}

export default function Home() {
  const [mode, setMode] = useState<Mode | null>(null);

  const navItems: MenuBarItem[] = [
    {
      label: "Home",
      icon: (p) => <HomeNavIcon {...p} />,
      onClick: () => setMode(null),
    },
    ...MODES.map((m) => ({
      label: m.label,
      icon: MODE_ICONS[m.id],
      onClick: () => setMode(m.id),
    })),
  ];

  const activeNavIndex = mode === null ? 0 : MODES.findIndex((m) => m.id === mode) + 1;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#000" }}>
      <AnimatePresence mode="wait">
        {mode === null ? (
          <Landing key="landing" />
        ) : (
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ position: "absolute", inset: 0 }}
          >
            {SCREENS[mode]}
          </motion.div>
        )}
      </AnimatePresence>

      {/* floating bottom dock */}
      <div
        style={{
          position: "fixed",
          bottom: 18,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
        }}
      >
        <MenuBar items={navItems} activeItemIndex={activeNavIndex} />
      </div>
    </div>
  );
}

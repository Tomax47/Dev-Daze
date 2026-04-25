"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar, type Mode } from "@/components/navbar";
import { ParticleNebula } from "@/components/modes/particle-nebula";
import { BlackHole } from "@/components/modes/black-hole";
import { RipplePool } from "@/components/modes/ripple-pool";
import { VibeRoom } from "@/components/modes/vibe-room";
import { GravityDojo } from "@/components/modes/gravity-dojo";
import { LavaLamp } from "@/components/modes/lava-lamp";
import { SandFall } from "@/components/modes/sand-fall";
import { Kaleidoscope } from "@/components/modes/kaleidoscope";
import { Liquid } from "@/components/modes/liquid";

const SCREENS: Record<Mode, React.ReactNode> = {
  nebula:    <ParticleNebula />,
  blackhole: <BlackHole />,
  ripple:    <RipplePool />,
  gravity:   <GravityDojo />,
  lavalamp:  <LavaLamp />,
  sand:         <SandFall />,
  kaleidoscope: <Kaleidoscope />,
  liquid:       <Liquid />,
  vibe:         <VibeRoom />,
};

export default function Home() {
  const [mode, setMode] = useState<Mode>("nebula");

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Navbar active={mode} onChange={setMode} />

      <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
        <AnimatePresence mode="wait">
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
        </AnimatePresence>
      </div>
    </div>
  );
}

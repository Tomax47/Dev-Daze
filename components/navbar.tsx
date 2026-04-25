"use client";

import { motion } from "framer-motion";

export type Mode =
  | "nebula"
  | "blackhole"
  | "ripple"
  | "gravity"
  | "lavalamp"
  | "sand"
  | "kaleidoscope"
  | "liquid"
  | "vibe";

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

interface NavbarProps {
  active: Mode;
  onChange: (m: Mode) => void;
}

export function Navbar({ active, onChange }: NavbarProps) {
  return (
    <header
      style={{
        position: "relative",
        zIndex: 50,
        height: 54,
        display: "flex",
        alignItems: "center",
        paddingInline: 28,
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontFamily: "LilitaOne, sans-serif",
          fontSize: 20,
          color: "#fff",
          letterSpacing: "0.01em",
          lineHeight: 1,
          userSelect: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Dev Daze
      </span>

      <nav
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {MODES.map((m) => {
          const isActive = active === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              style={{
                position: "relative",
                padding: "6px 14px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: isActive ? "#fff" : "rgba(255,255,255,0.36)",
                fontSize: 13,
                fontWeight: 500,
                letterSpacing: "0.02em",
                whiteSpace: "nowrap",
                transition: "color 0.2s",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-underline"
                  transition={{ type: "spring", stiffness: 420, damping: 40 }}
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 10,
                    right: 10,
                    height: 2,
                    borderRadius: 2,
                    background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
                  }}
                />
              )}
              {m.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

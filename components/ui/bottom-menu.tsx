"use client"

import * as React from "react"
import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import { cn } from "@/lib/utils"

export interface MenuBarItem {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element
  label: string
  onClick?: () => void
}

interface MenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  items: MenuBarItem[]
  activeItemIndex?: number | null
}

import type { Transition } from "framer-motion"
const springConfig: Transition = { duration: 0.3, ease: "easeInOut" }

// Radial menu constants
const TRIGGER_SIZE = 50
const ITEM_SIZE    = 30
const RADIUS       = 170

// Spread items in a 160° upward arc (–160° → –20° in standard coords, y-axis flipped in screen)
function arcPoint(i: number, n: number, r: number) {
  const startDeg = -160
  const endDeg   = -20
  const deg = n <= 1 ? -90 : startDeg + (endDeg - startDeg) * (i / (n - 1))
  const rad = (deg * Math.PI) / 180
  return { x: r * Math.cos(rad), y: r * Math.sin(rad) }
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
         strokeLinecap="round" {...props}>
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </svg>
  )
}

export function MenuBar({ items, className, activeItemIndex, ...props }: MenuBarProps) {
  const [hoverIndex,  setHoverIndex]  = React.useState<number | null>(null)
  const menuRef    = React.useRef<HTMLDivElement>(null)
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [tooltipLeft, setTooltipLeft] = React.useState(0)
  const [isMobile,   setIsMobile]   = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const triggerControls = useAnimationControls()
  const shakeControls   = useAnimationControls()

  // Detect mobile breakpoint
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const update = () => { setIsMobile(mq.matches); if (!mq.matches) setIsExpanded(false) }
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  // Close on outside tap
  React.useEffect(() => {
    if (!isExpanded) return
    const handler = (e: MouseEvent | TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setIsExpanded(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [isExpanded])

  // Desktop tooltip position
  React.useEffect(() => {
    if (hoverIndex !== null && menuRef.current && tooltipRef.current) {
      const menuItem  = menuRef.current.children[hoverIndex] as HTMLElement
      const menuRect  = menuRef.current.getBoundingClientRect()
      const itemRect  = menuItem.getBoundingClientRect()
      const tipRect   = tooltipRef.current.getBoundingClientRect()
      const left = itemRect.left - menuRect.left + (itemRect.width - tipRect.width) / 2
      setTooltipLeft(Math.max(0, Math.min(left, menuRect.width - tipRect.width)))
    }
  }, [hoverIndex])

  // Close animation (ripple-pulse on trigger, like the reference)
  const runCloseAnimation = React.useCallback(async () => {
    const steps = [1.18, 1.32, 1.18, 1]
    shakeControls.start({
      x: [0, 3, -3, 2, -2, 0],
      transition: { duration: 0.28, ease: "linear" }
    })
    for (const s of steps) {
      await triggerControls.start({
        scale: s,
        transition: { duration: 0.07, ease: "linear" }
      })
    }
    shakeControls.start({ x: 0, transition: { duration: 0 } })
  }, [triggerControls, shakeControls])

  // ── Mobile: radial circle menu ────────────────────────────────────────────
  if (isMobile) {
    const activeItem = items[activeItemIndex ?? 0]
    const offset = (TRIGGER_SIZE - ITEM_SIZE) / 2   // center items on trigger origin

    return (
      <motion.div
        ref={wrapperRef}
        animate={shakeControls}
        className={cn("relative", className)}
        style={{ width: TRIGGER_SIZE, height: TRIGGER_SIZE }}
        {...props}
      >
        {/* Radial items */}
        <AnimatePresence>
          {isExpanded && items.map((item, index) => {
            const { x, y } = arcPoint(index, items.length, RADIUS)
            const isActive  = activeItemIndex === index
            return (
              <motion.button
                key={index}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                animate={{ x, y, opacity: 1, scale: 1 }}
                exit={{
                  x: 0, y: 0, opacity: 0, scale: 0.4,
                  transition: {
                    delay: (items.length - 1 - index) * 0.014,
                    type: "spring", stiffness: 420, damping: 32
                  }
                }}
                transition={{
                  delay: index * 0.022,
                  type: "spring", stiffness: 340, damping: 26
                }}
                whileTap={{ scale: 0.88 }}
                onClick={() => { item.onClick?.(); setIsExpanded(false) }}
                style={{
                  position:        "absolute",
                  top:             offset,
                  left:            offset,
                  width:           ITEM_SIZE,
                  height:          ITEM_SIZE,
                  borderRadius:    "50%",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  background:      isActive ? "rgba(255,255,255,0.22)" : "rgba(30,30,30,0.75)",
                  backdropFilter:  "blur(12px)",
                  border:          `1px solid ${isActive ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.1)"}`,
                  color:           isActive ? "#fff" : "rgba(255,255,255,0.55)",
                  cursor:          "pointer",
                  zIndex:          40,
                  boxShadow:       "0 2px 12px rgba(0,0,0,0.45)",
                }}
              >
                <div style={{ width: 14, height: 14, display: "flex" }}>
                  <item.icon style={{ width: "100%", height: "100%" }} />
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>

        {/* Trigger button */}
        <motion.button
          animate={triggerControls}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isExpanded) {
              runCloseAnimation()
              setIsExpanded(false)
            } else {
              setIsExpanded(true)
            }
          }}
          style={{
            position:       "absolute",
            inset:          0,
            borderRadius:   "50%",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            background:     "rgba(0,0,0,0.55)",
            backdropFilter: "blur(20px)",
            border:         "1px solid rgba(255,255,255,0.14)",
            color:          "#fff",
            cursor:         "pointer",
            zIndex:         50,
            boxShadow:      "0 4px 24px rgba(0,0,0,0.5)",
          }}
          aria-label={isExpanded ? "Close menu" : "Open menu"}
        >
          <AnimatePresence mode="popLayout">
            {isExpanded ? (
              <motion.span
                key="close"
                initial={{ opacity: 0, filter: "blur(6px)", rotate: -45 }}
                animate={{ opacity: 1, filter: "blur(0px)", rotate: 0 }}
                exit={{ opacity: 0, filter: "blur(6px)", rotate: 45 }}
                transition={{ duration: 0.16 }}
                style={{ display: "flex" }}
              >
                <CloseIcon style={{ width: 15, height: 15 }} />
              </motion.span>
            ) : (
              <motion.span
                key="active"
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.16 }}
                style={{ display: "flex" }}
              >
                <div style={{ width: 20, height: 20 }}>
                  <activeItem.icon style={{ width: "100%", height: "100%" }} />
                </div>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </motion.div>
    )
  }

  // ── Desktop: horizontal bar ───────────────────────────────────────────────
  return (
    <div className={cn("relative inline-block", className)} {...props}>
      <AnimatePresence>
        {hoverIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={springConfig}
            className="absolute left-0 right-0 -top-[31px] pointer-events-none z-50"
          >
            <motion.div
              ref={tooltipRef}
              className="h-7 px-3 rounded-lg inline-flex justify-center items-center bg-black/70 backdrop-blur border border-white/10"
              initial={{ x: tooltipLeft }}
              animate={{ x: tooltipLeft }}
              transition={springConfig}
            >
              <p className="text-[12px] font-medium whitespace-nowrap text-white/70">
                {items[hoverIndex].label}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={menuRef}
        className="h-12 px-5 inline-flex justify-center items-center gap-1 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      >
        {items.map((item, index) => {
          const isActive = activeItemIndex === index
          return (
            <button
              key={index}
              onClick={item.onClick}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              className={cn(
                "w-8 h-8 rounded-full flex justify-center items-center transition-all duration-200",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/35 hover:bg-white/10 hover:text-white/75"
              )}
            >
              <div className="w-[17px] h-[17px] flex justify-center items-center">
                <item.icon className="w-full h-full" />
              </div>
              <span className="sr-only">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

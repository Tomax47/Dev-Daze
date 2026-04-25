"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
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

export function MenuBar({ items, className, activeItemIndex, ...props }: MenuBarProps) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [tooltipLeft, setTooltipLeft] = React.useState(0)
  const tooltipRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (hoverIndex !== null && menuRef.current && tooltipRef.current) {
      const menuItem = menuRef.current.children[hoverIndex] as HTMLElement
      const menuRect = menuRef.current.getBoundingClientRect()
      const itemRect = menuItem.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const left = itemRect.left - menuRect.left + (itemRect.width - tooltipRect.width) / 2
      setTooltipLeft(Math.max(0, Math.min(left, menuRect.width - tooltipRect.width)))
    }
  }, [hoverIndex])

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
        className="h-11 px-1.5 inline-flex justify-center items-center gap-[2px] rounded-full bg-black/50 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
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

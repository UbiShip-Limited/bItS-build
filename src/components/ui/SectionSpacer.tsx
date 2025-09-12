"use client"

import { motion } from "framer-motion"

interface SectionSpacerProps {
  size?: "small" | "medium" | "large" | "xlarge"
  showDivider?: boolean
  dividerStyle?: "line" | "dots" | "ornament"
}

export function SectionSpacer({ 
  size = "medium", 
  showDivider = true,
  dividerStyle = "line" 
}: SectionSpacerProps) {
  const sizeClasses = {
    small: "py-10 md:py-16",
    medium: "py-16 md:py-24",
    large: "py-20 md:py-32",
    xlarge: "py-24 md:py-40"
  }

  const renderDivider = () => {
    switch (dividerStyle) {
      case "dots":
        return (
          <div className="flex items-center justify-center gap-4">
            <motion.div 
              className="w-1.5 h-1.5 bg-gold-500/20 rounded-full"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0, duration: 0.5 }}
            />
            <motion.div 
              className="w-2 h-2 bg-gold-500/30 rounded-full relative"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-xs scale-150" />
            </motion.div>
            <motion.div 
              className="w-1.5 h-1.5 bg-gold-500/20 rounded-full"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            />
          </div>
        )
      case "ornament":
        return (
          <div className="flex items-center justify-center">
            <motion.div 
              className="w-32 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-gold-500/10"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
            <motion.div 
              className="mx-6 w-2.5 h-2.5 bg-gold-500/30 rounded-full relative"
              initial={{ scale: 0, rotate: 0 }}
              whileInView={{ scale: 1, rotate: 180 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="absolute inset-0 bg-gold-500/10 rounded-full blur-sm scale-[2]" />
            </motion.div>
            <motion.div 
              className="w-32 h-px bg-gradient-to-l from-transparent via-gold-500/20 to-gold-500/10"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
            />
          </div>
        )
      default:
        return (
          <motion.div 
            className="w-48 md:w-64 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        )
    }
  }

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      {showDivider && (
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {renderDivider()}
        </motion.div>
      )}
    </div>
  )
}
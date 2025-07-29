"use client";

import React from "react";
import { motion } from "framer-motion";
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

export function TattooAftercareGuide() {
  return (
    <div id="aftercare" className={layout.sectionY.large}>
      {/* Header Section */}
      <motion.div 
        className="mx-auto max-w-7xl px-6 text-center mb-16 md:mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center mb-8">
          <div className={components.ornament.lineLong}></div>
          <div className="mx-6">
            <div className={`${components.ornament.dot} relative`}>
              <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-[2]"></div>
            </div>
          </div>
          <div className={components.ornament.lineLong}></div>
        </div>
        <h2 className={`${typography.h1} text-obsidian dark:${colors.textPrimary} mb-8`}>
          Tattoo Aftercare Guide
        </h2>
        <p className={`${typography.paragraphLarge} text-obsidian/70 dark:${colors.textSecondary} max-w-3xl mx-auto ${typography.fontLight} ${typography.leadingRelaxed}`}>
          Proper aftercare is essential for the healing and longevity of your new tattoo. 
          Follow these essential steps to ensure your tattoo heals beautifully and maintains its vibrant appearance.
        </p>
      </motion.div>

      {/* Grid Section */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-8">
        {aftercareSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-obsidian/90 to-obsidian/80 backdrop-blur-md p-8 md:p-10 border border-gold-500/10 shadow-refined hover:shadow-refined-lg hover:border-gold-500/20 transition-all duration-800 ease-smooth h-full">
              {/* Glow effects */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 rounded-full blur-3xl group-hover:bg-gold-500/10 transition-all duration-800"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gold-500/3 rounded-full blur-2xl group-hover:bg-gold-500/8 transition-all duration-800"></div>
              
              {/* Corner accents */}
              <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-gold-500/20 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-gold-500/20 rounded-br-xl opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
              
              {/* Content */}
              <div className="relative z-10">
                <h3 className={`${typography.fontUI} text-xl md:text-2xl ${typography.fontSemibold} text-white/90 mb-4 ${typography.leadingTight}`}>
                  {step.title}
                </h3>
                <p className={`${typography.fontUI} text-base md:text-lg ${typography.leadingRelaxed} text-white/70 ${typography.fontLight}`}>
                  {step.description}
                </p>
              </div>
              
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gold-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-600 rounded-3xl pointer-events-none"></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Important Note */}
      <motion.div 
        className="mx-auto max-w-4xl px-6 mt-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold-500/10 to-gold-500/5 backdrop-blur-sm p-8 md:p-10 border border-gold-500/20">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl"></div>
          <p className={`${typography.fontUI} text-lg md:text-xl ${colors.textAccent} ${typography.fontMedium} mb-2`}>
            Important Reminder
          </p>
          <p className={`${typography.fontUI} text-base md:text-lg text-white/80 ${typography.leadingRelaxed}`}>
            If you have any concerns about your healing tattoo, don't hesitate to contact your artist. 
            We're here to ensure your tattoo heals perfectly.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const aftercareSteps = [
  {
    title: "Bandage Removal",
    description:
      "Regular bandage: remove in 6-24 hours. Second skin: remove in 5-7 days.",
  },
  {
    title: "Gentle Cleaning",
    description:
      "Once bandage is removed, gently clean tattoo with clean hands, lukewarm water and mild soap. Pat dry with clean paper towel or towel.",
  },
  {
    title: "Let It Breathe",
    description:
      "Let your tattoo breathe, avoid direct sun, or soaking it in water for a couple weeks.",
  },
  {
    title: "Moisturize If Needed",
    description:
      "Apply small amount of moisturizer (avoid essential oils) if itchy or dry. Less is more.",
  },
  {
    title: "Wear Loose Clothing",
    description:
      "Wear loose, lightweight clothing during the healing process to avoid irritation.",
  },
  {
    title: "Protect & Don't Pick",
    description:
      "Keep out of direct sunlight, do not scratch, pick, or soak the tattoo until it has healed completely.",
  },
  {
    title: "Follow Instructions",
    description:
      "By following these instructions you should have a well healed tattoo! Contact your artist if you have concerns.",
  },
  {
    title: "Touch-Up Policy",
    description:
      "First set of touch-ups are included in your tattoo cost when booked within 6 months with your original artist.",
  },
];
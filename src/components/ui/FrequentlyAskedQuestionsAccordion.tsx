"use client";
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

const FAQs = [
  {
    question: "Where is Bowen Island?",
    answer:
      "Bowen Island is a short 20 minute ferry right from Horseshoe Bay. You can drive over or walk on. Bowen Island Tattoo Shop is located in Artisan Square, which is about a 5 minute drive off the ferry or a 15 minute walk up the hill. There are also busses on Bowen that can shuttle you up the hill.",
  },
  {
    question: "How do I book an appointment?",
    answer:
      "You can book in directly through the 'book' button here on the website. You can choose 'tattoo consult' to begin and the artist you'd wish to be tattooed by. Your consult can be in person at the shop, by phone or email at your request. At your consult we will discuss your design, get any references you have and then book you for your tattoo appointment and collect a non refundable deposit. The deposit will go towards your final cost of the tattoo.",
  },
  {
    question: "What does a tattoo cost?",
    answer:
      "Kelly charges $170/hour for larger/ongoing designs or charges a set price by piece. There is a minimum of $90. Lacey is a new artist building her portfolio, she charges $125/hr.",
  },
  {
    question: "What payment do we accept?",
    answer:
      "Kelly accepts visa, debit, etransfer and cash while Lacey is currently accepting etransfer and cash only.",
  },
  {
    question: "This is my first tattoo, any tips?",
    answer:
      "How exciting! When preparing for your tattoo, we always recommend you are showered, well rested, have something to eat before, and wear loose clothing depending on the location you want your tattoo. Bring a bottle of water and snack with you for your tattoo appointment as well. You may bring 1 person for support, but avoid bringing the whole crew or your pets/kids. Your artist will also give you all the info you need for your aftercare as well as be checking in with you during your appointment to make sure you are comfortable.",
  },
  {
    question: "Can I see any of your portfolio?",
    answer:
      "Yes, you can view both artists recent work here as well as on instagram and Facebook.",
  },
  {
    question: "Cancellation and non refundable deposit policy",
    answer:
      "At the time of our consult, we will collect a non refundable deposit variable depending on design. The non refundable deposit will go towards the final cost of the tattoo. The deposit is non refundable, the Artist has taken their time to sit with you, consult and draw the tattoo you described to them. Upon cancellation, the deposit held then transfers to the Artist to help compensate for the Artists lost time. In the event you need to cancel or reschedule, We require a minimum of 48 hour notice in order for your deposit to be carried forward. If there is a no show the deposit will be forfeit to make up for the artists lost time.",
  },
];

export function FrequentlyAskedQuestionsAccordion() {
  const [open, setOpen] = useState<string | null>(null);
  
  return (
    <div 
      id="faq" 
      className={`mx-auto grid ${layout.containerLg} grid-cols-1 gap-8 md:gap-12 ${layout.padding.mobile} ${layout.sectionY.large} md:grid-cols-2 ${layout.padding.desktop}`}
      style={{ 
        color: 'white',
        backgroundColor: 'transparent'
      }}
    >
      <div className="text-center md:text-left">
        <h2 className={`${typography.h1} text-obsidian dark:text-white mb-8`}>
          Frequently asked questions
        </h2>
        <div className="flex items-center justify-center md:justify-start mb-6">
          <div className={components.ornament.lineShort}></div>
          <div className={`${components.ornament.dot} mx-5 relative`}>
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-[2]"></div>
          </div>
        </div>
        <p className={`${typography.paragraphLarge} text-obsidian/60 dark:text-white/70 max-w-md mx-auto md:mx-0`}>
          Everything you need to know about getting your tattoo at Bowen Island Tattoo Shop.
        </p>
      </div>
      <div className="space-y-4 md:space-y-5">
        {FAQs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            open={open}
            setOpen={setOpen}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

const FAQItem = ({
  question,
  answer,
  setOpen,
  open,
  index,
}: {
  question: string;
  answer: string;
  open: string | null;
  setOpen: (open: string | null) => void;
  index: number;
}) => {
  const isOpen = open === question;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative cursor-pointer py-4 md:py-8 px-4 md:px-8 rounded-2xl border transition-all duration-300 backdrop-blur-sm group",
        isOpen 
          ? "border-gold-500/20 bg-gold-500/5 shadow-soft" 
          : "border-gold-500/5 hover:border-gold-500/10 hover:bg-gold-500/3 shadow-subtle hover:shadow-soft"
      )}
      onClick={() => {
        if (isOpen) {
          setOpen(null);
        } else {
          setOpen(question);
        }
      }}
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-br from-gold-500/5 to-transparent opacity-0 transition-opacity duration-600",
        isOpen && "opacity-100"
      )} />
      
      {/* Corner accents */}
      <div className={cn(
        "absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-gold-500/20 rounded-tl-lg transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )} />
      <div className={cn(
        "absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-gold-500/20 rounded-br-lg transition-all duration-300",
        isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-50"
      )} />
      
      <div className="relative flex items-start">
        <div className="relative mr-3 md:mr-4 mt-1 h-5 w-5 md:h-6 md:w-6 flex-shrink-0">
          <Plus
            className={cn(
              "absolute inset-0 h-5 w-5 md:h-6 md:w-6 transform text-gold-500 transition-all duration-300",
              isOpen && "rotate-90 scale-0 opacity-0",
            )}
          />
          <Minus
            className={cn(
              "absolute inset-0 h-5 w-5 md:h-6 md:w-6 rotate-90 scale-0 transform text-gold-500 transition-all duration-300 opacity-0",
              isOpen && "rotate-0 scale-100 opacity-100",
            )}
          />
        </div>
        <div className="flex-1">
          <h3 className={`${typography.fontUI} text-xl md:text-2xl ${typography.fontMedium} text-obsidian/90 dark:text-white/90 ${typography.leadingTight}`}>
            {question}
          </h3>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <p className={`mt-4 ${typography.fontUI} text-base md:text-lg ${typography.leadingRelaxed} text-obsidian/70 dark:text-white/70 ${typography.fontLight} pr-2`}>
                  {answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}; 
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../utils/sound';
import { Sparkles, HelpCircle } from 'lucide-react';

interface TransitionScreenProps {
  onComplete: () => void;
  message?: string;
  subMessage?: string;
}

export default function TransitionScreen({ 
  onComplete, 
  message = "WHAT'S NEXT?", 
  subMessage = "Think you've got it?" 
}: TransitionScreenProps) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    sound.playExplosion(); // Play a soft ambient sound on entrance
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        sound.playTick(); // Tick on every second
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      onComplete();
    }
  }, [countdown, onComplete]);

  // Generate random positions for floating question marks
  const floaters = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    x: Math.random() * 80 + 10,
    y: Math.random() * 80 + 10,
    size: Math.random() * 20 + 20,
    delay: Math.random() * 2,
    duration: Math.random() * 3 + 3,
  }));

  return (
    <div id="transition-screen" className="relative w-full min-h-screen flex flex-col justify-center items-center bg-[#03060f] text-white overflow-hidden p-6">
      {/* Background radial overlays */}
      <div className="absolute w-[40%] h-[40%] rounded-full bg-yellow-500/10 blur-[120px] top-1/4 left-1/4 animate-pulse pointer-events-none" />
      <div className="absolute w-[45%] h-[45%] rounded-full bg-purple-500/10 blur-[150px] bottom-1/4 right-1/4 animate-pulse pointer-events-none" />

      {/* Floating question marks and bubbles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {floaters.map((f) => (
          <motion.div
            key={f.id}
            className="absolute text-yellow-400/20 text-3xl font-black font-mono select-none"
            style={{
              left: `${f.x}%`,
              top: `${f.y}%`,
              fontSize: `${f.size}px`,
            }}
            animate={{
              y: ['0px', '-100px'],
              x: ['0px', `${Math.sin(f.id) * 30}px`],
              rotate: [0, 360],
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: f.duration,
              delay: f.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            ?
          </motion.div>
        ))}
      </div>

      {/* Main Glass Card container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative z-10 p-12 rounded-3xl bg-slate-950/75 border border-yellow-500/30 shadow-[0_0_50px_rgba(245,158,11,0.25)] max-w-xl w-full text-center flex flex-col items-center backdrop-blur-xl"
      >
        {/* Animated Thinking Emoji */}
        <motion.div
          animate={{
            scale: [1, 1.12, 0.95, 1.05, 1],
            rotate: [0, 5, -5, 3, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-8xl mb-8 select-none drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]"
        >
          🤔
        </motion.div>

        {/* Thought bubble container */}
        <div className="mb-6 relative">
          <motion.h2 
            className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-500 drop-shadow-md"
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}
          </motion.h2>
          <p className="text-gray-400 text-lg tracking-wider font-mono mt-2">
            {subMessage}
          </p>
        </div>

        {/* Next challenge container */}
        <div className="mt-8 flex flex-col items-center">
          <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase mb-4">
            Next Challenge In
          </span>

          {/* Countdown badge with spinning circle */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Countdown ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-slate-800 fill-none"
                strokeWidth="8"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-yellow-400 fill-none"
                strokeWidth="8"
                strokeDasharray="301.6"
                animate={{
                  strokeDashoffset: [0, 301.6],
                }}
                transition={{
                  duration: 5,
                  ease: "linear",
                }}
              />
            </svg>

            {/* Glowing number inside */}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={countdown}
                initial={{ opacity: 0, scale: 0.5, y: -10 }}
                animate={{ opacity: 1, scale: 1.1, y: 0 }}
                exit={{ opacity: 0, scale: 1.5, y: 10 }}
                transition={{ duration: 0.3 }}
                className="text-4xl font-black tracking-tighter text-yellow-300 font-mono drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
              >
                {countdown}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Decorative prompt instruction */}
      <span className="absolute bottom-10 text-xs font-mono tracking-widest text-slate-500 z-10 animate-pulse">
        PREPARING NEXT CHANNELS ON THE CORE MIXER...
      </span>
    </div>
  );
}

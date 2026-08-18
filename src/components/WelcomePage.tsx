/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CollegeLogo from './CollegeLogo';
import { sound } from '../utils/sound';
import { Sparkles, Brain, Mic, HelpCircle, Gamepad2 } from 'lucide-react';

interface WelcomePageProps {
  onStart: () => void;
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate floating particles for an arcade game atmosphere
    const list = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(list);
  }, []);

  const handleStart = () => {
    sound.playSuccess();
    onStart();
  };

  return (
    <div id="welcome-screen" className="relative w-full min-h-screen flex flex-col justify-between items-center bg-[#050b14] text-white overflow-hidden p-6 md:p-12">
      {/* Dynamic colorful glowing background spots */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[15%] w-[30%] h-[30%] rounded-full bg-purple-600/10 blur-[100px] pointer-events-none" />

      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-cyan-400/30"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
            }}
            animate={{
              y: ['0px', '-200px'],
              x: ['0px', `${Math.sin(p.id) * 40}px`],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Top Header - Event Badges */}
      <motion.div 
        className="w-full flex justify-between items-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-xs font-mono tracking-widest text-cyan-400 border border-cyan-400/30 rounded-full px-4 py-1 bg-cyan-950/20 shadow-[0_0_15px_rgba(34,211,238,0.15)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          INAUGURAL EDITION
        </span>
        <span className="text-xs font-mono tracking-widest text-red-400 border border-red-500/30 rounded-full px-4 py-1 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] flex items-center gap-2">
          <Gamepad2 className="w-3 h-3 text-red-400" />
          INTER-DEPARTMENTAL
        </span>
      </motion.div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col justify-center items-center text-center z-10 max-w-4xl py-8">
        {/* College Logo */}
        <div className="mb-6 flex justify-center">
          <CollegeLogo size={190} animate={true} />
        </div>

        {/* Institution Name */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-4"
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-300 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            KALAIGNAR KARUNANIDHI
          </h1>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-widest text-red-500 mt-1 sm:mt-2 drop-shadow-[0_2px_8px_rgba(239,68,68,0.2)]">
            INSTITUTE OF TECHNOLOGY
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-[0.4em] mt-3">
            COIMBATORE • APPROVED BY AICTE • AFFILIATED TO ANNA UNIVERSITY
          </p>
        </motion.div>

        {/* Separator / Glowing neon line */}
        <motion.div 
          className="h-[2px] w-64 bg-gradient-to-r from-transparent via-cyan-400 to-transparent my-6"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        />

        {/* Animated Slogan Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="relative px-6 py-3 rounded-xl bg-[#091526]/50 border border-cyan-500/20 shadow-[inset_0_0_20px_rgba(6,182,212,0.15)] mb-10 overflow-hidden"
        >
          <h3 className="text-lg sm:text-2xl md:text-3xl font-black font-sans tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500">
            GET READY TO THINK • GUESS • SPEAK
          </h3>
          
          {/* Subtle neon glowing scanning line */}
          <motion.div 
            className="absolute top-0 bottom-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none"
            animate={{
              left: ['-100%', '200%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </motion.div>

        {/* Main Big Animated Button */}
        <motion.button
          id="btn-start-experience"
          onClick={handleStart}
          whileHover={{ scale: 1.06, boxShadow: "0 0 40px rgba(34, 211, 238, 0.6)" }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 100, 
            damping: 10,
            delay: 0.9 
          }}
          className="group relative cursor-pointer font-black text-xl md:text-2xl tracking-widest px-12 py-5 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white border-2 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all overflow-hidden"
        >
          {/* Animated button overlay shine */}
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:animate-shine" />
          
          <span className="relative z-10 flex items-center justify-center gap-3">
            START THE EXPERIENCE
            <Sparkles className="w-6 h-6 text-yellow-300 group-hover:rotate-12 transition-transform" />
          </span>
          
          {/* Pulsing outer ring */}
          <div className="absolute inset-[-4px] rounded-full border border-cyan-400/50 animate-pulse pointer-events-none" />
        </motion.button>
      </div>

      {/* Floating Glowing Game Icons Grid at the bottom */}
      <motion.div 
        className="w-full flex justify-center gap-8 sm:gap-16 items-center text-gray-500 z-10 mt-auto pt-6 border-t border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 1.1 }}
      >
        <div className="flex flex-col items-center gap-1 group">
          <Brain className="w-6 h-6 text-cyan-400/50 group-hover:text-cyan-400 transition-colors" />
          <span className="text-[10px] font-mono tracking-widest text-gray-500 group-hover:text-cyan-400 transition-colors">THINK</span>
        </div>
        <div className="flex flex-col items-center gap-1 group">
          <HelpCircle className="w-6 h-6 text-purple-400/50 group-hover:text-purple-400 transition-colors" />
          <span className="text-[10px] font-mono tracking-widest text-gray-500 group-hover:text-purple-400 transition-colors">GUESS</span>
        </div>
        <div className="flex flex-col items-center gap-1 group">
          <Mic className="w-6 h-6 text-red-400/50 group-hover:text-red-400 transition-colors" />
          <span className="text-[10px] font-mono tracking-widest text-gray-500 group-hover:text-red-400 transition-colors">SPEAK</span>
        </div>
      </motion.div>
    </div>
  );
}

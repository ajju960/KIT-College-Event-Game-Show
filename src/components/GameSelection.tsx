/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { sound } from '../utils/sound';
import { Brain, MessageSquareQuote, Disc, Settings2, Play, Sparkles } from 'lucide-react';
import { GameType } from '../types';

interface GameSelectionProps {
  onSelectGame: (game: GameType) => void;
  onOpenAdmin: () => void;
  onBackToWelcome: () => void;
}

export default function GameSelection({ onSelectGame, onOpenAdmin, onBackToWelcome }: GameSelectionProps) {
  const cards = [
    {
      id: 'CTRL_GUESS' as GameType,
      title: 'CTRL + GUESS',
      subtitle: 'ROUND 01 - TECHNICAL',
      description: '3 technical images. 1 connected answer. Can you connect the engineering clues?',
      icon: Brain,
      themeColor: 'cyan',
      bgGradient: 'from-cyan-950/40 to-blue-950/40 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_35px_rgba(6,182,212,0.4)]',
      btnBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      accentColor: 'text-cyan-400',
    },
    {
      id: 'GUESS_PANNU_BRO' as GameType,
      title: 'GUESS PANNU BRO?',
      subtitle: 'ROUND 02 - FUN & CAMPUS LIFE',
      description: 'Look closely. Think fast. Connect the hilarious memes and college hostel clues!',
      icon: MessageSquareQuote,
      themeColor: 'amber',
      bgGradient: 'from-amber-950/40 to-orange-950/40 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_35px_rgba(245,158,11,0.4)]',
      btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      accentColor: 'text-amber-400',
    },
    {
      id: 'PICK_SPEAK' as GameType,
      title: 'PICK & SPEAK',
      subtitle: 'ROUND 03 - SPIN & ACT',
      description: 'Spin the giant theatrical wheel! Get a popular actor and speak your mind on stage!',
      icon: Disc,
      themeColor: 'pink',
      bgGradient: 'from-pink-950/40 to-purple-950/40 border-pink-500/30 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.15)] hover:shadow-[0_0_35px_rgba(236,72,153,0.4)]',
      btnBg: 'bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-400 hover:to-purple-400 shadow-[0_0_15px_rgba(236,72,153,0.3)]',
      accentColor: 'text-pink-400',
    },
  ];

  const handleSelectGame = (gameId: GameType) => {
    sound.playSuccess();
    onSelectGame(gameId);
  };

  return (
    <div id="game-selection-screen" className="relative w-full min-h-screen flex flex-col justify-between bg-[#040812] text-white overflow-hidden p-6 md:p-12">
      {/* Background radial decorations */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-pink-500/5 blur-[150px] pointer-events-none" />
      
      {/* Top control bar */}
      <div className="w-full flex justify-between items-center z-10 mb-8">
        <button 
          onClick={() => { sound.playClick(); onBackToWelcome(); }}
          className="px-4 py-2 text-xs md:text-sm font-mono tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
        >
          ← BACK TO WELCOME
        </button>

        <h2 className="hidden md:block text-sm font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">
          EVENT GAMEPLAY SELECTOR
        </h2>

        <button 
          onClick={() => { sound.playClick(); onOpenAdmin(); }}
          className="flex items-center gap-2 px-4 py-2 text-xs md:text-sm font-mono tracking-widest text-cyan-400 hover:text-white border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <Settings2 className="w-4 h-4" />
          ORGANIZER DASHBOARD
        </button>
      </div>

      {/* Main Title Header */}
      <div className="text-center z-10 mb-8 max-w-2xl mx-auto">
        <motion.h1 
          className="text-3xl md:text-5xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-100 to-gray-300"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          SELECT GAME SHOW
        </motion.h1>
        <motion.p 
          className="text-xs md:text-sm font-mono text-gray-400 tracking-wider mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          CHOOSE A ROUND TO PRESENT ON THE MAIN PROJECTOR SCREEN
        </motion.p>
      </div>

      {/* Grid of Game Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto w-full z-10 flex-grow justify-center items-center py-4">
        {cards.map((card, idx) => {
          const CardIcon = card.icon;
          return (
            <motion.div
              id={`card-${card.id.toLowerCase()}`}
              key={card.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              whileHover={{ 
                y: -12,
                scale: 1.03,
              }}
              className={`group flex flex-col justify-between h-full min-h-[420px] p-8 rounded-2xl bg-gradient-to-b ${card.bgGradient} border backdrop-blur-md transition-all duration-300 relative overflow-hidden`}
            >
              {/* Particle glow inside card */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              
              {/* Card top banner */}
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-mono tracking-widest text-gray-400 border border-white/10 rounded-full px-3 py-1 bg-white/5">
                  {card.subtitle}
                </span>
                <Sparkles className="w-5 h-5 text-yellow-400/50 group-hover:text-yellow-400 transition-colors animate-pulse" />
              </div>

              {/* Central Graphic / Icon */}
              <div className="flex flex-col items-center justify-center my-6 flex-grow">
                <motion.div 
                  className={`p-6 rounded-2xl bg-slate-900/60 border border-white/5 mb-6 group-hover:border-cyan-500/20 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] transition-all relative`}
                  whileHover={{ rotate: 12 }}
                >
                  <CardIcon className="w-16 h-16" />
                </motion.div>
                <h3 className="text-2xl font-black tracking-widest text-white group-hover:text-yellow-300 transition-colors text-center">
                  {card.title}
                </h3>
              </div>

              {/* Card bottom description & button */}
              <div className="mt-4">
                <p className="text-sm text-gray-400 text-center mb-8 h-12 leading-relaxed">
                  {card.description}
                </p>

                <button
                  onClick={() => handleSelectGame(card.id)}
                  className={`w-full py-4 px-6 rounded-xl font-bold tracking-widest text-sm flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${card.btnBg}`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  PLAY NOW
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer footer info */}
      <div className="text-center text-xs text-gray-600 font-mono mt-8 z-10 border-t border-white/5 pt-4">
        KALAIGNAR KARUNANIDHI INSTITUTE OF TECHNOLOGY • DESIGNED FOR LIVE EVENT SCREENING
      </div>
    </div>
  );
}

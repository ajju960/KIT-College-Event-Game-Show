/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question } from '../types';
import { sound } from '../utils/sound';
import { 
  Play, Pause, RotateCcw, Eye, HelpCircle, ArrowRight, Maximize2, Minimize2, ChevronRight, Lock, Unlock, Sparkles
} from 'lucide-react';

interface CtrlGuessGameProps {
  questions: Question[];
  currentQuestionIndex: number;
  revealedCount: number;
  isClueRevealed: boolean;
  isAnswerRevealed: boolean;
  timerSeconds: number;
  isTimerRunning: boolean;
  isFullScreen: boolean;
  onSetRevealedCount: (count: number) => void;
  onSetClueRevealed: (rev: boolean) => void;
  onSetAnswerRevealed: (rev: boolean) => void;
  onSetTimerSeconds: (sec: number | ((prev: number) => number)) => void;
  onSetTimerRunning: (run: boolean) => void;
  onToggleFullScreen: () => void;
  onNextQuestionTrigger: () => void;
  onBackToSelection: () => void;
  gameTitle?: string;
  subtitle?: string;
  playfulStyle?: boolean;
}

export default function CtrlGuessGame({
  questions,
  currentQuestionIndex,
  revealedCount,
  isClueRevealed,
  isAnswerRevealed,
  timerSeconds,
  isTimerRunning,
  isFullScreen,
  onSetRevealedCount,
  onSetClueRevealed,
  onSetAnswerRevealed,
  onSetTimerSeconds,
  onSetTimerRunning,
  onToggleFullScreen,
  onNextQuestionTrigger,
  onBackToSelection,
  gameTitle = "CTRL+GUESS",
  subtitle = "3 IMAGES, 1 TECHNICAL NAME – CAN YOU GUESS?",
  playfulStyle = false,
}: CtrlGuessGameProps) {
  
  const question = questions[currentQuestionIndex];
  const [celebrationConfetti, setCelebrationConfetti] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        onSetTimerSeconds((prev) => {
          if (prev <= 1) {
            onSetTimerRunning(false);
            sound.playBuzzer();
            return 0;
          }
          if (prev <= 6) {
            sound.playTick(); // tick faster at the end
          } else {
            sound.playTick();
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Handle revealing the next image
  const handleRevealNextImage = () => {
    if (revealedCount < 3) {
      const next = revealedCount + 1;
      onSetRevealedCount(next);
      sound.playExplosion();
    }
  };

  // Handle revealing clue
  const handleRevealClue = () => {
    onSetClueRevealed(true);
    sound.playSuccess();
  };

  // Handle revealing answer
  const handleShowAnswer = () => {
    onSetAnswerRevealed(true);
    onSetTimerRunning(false);
    sound.playDing();
    
    // Generate simple celebration confetti coordinates
    const list = Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -50,
      color: ['#06b6d4', '#f5e04b', '#ec4899', '#3b82f6', '#10b981', '#f97316'][Math.floor(Math.random() * 6)],
      size: Math.random() * 8 + 6,
    }));
    setCelebrationConfetti(list);
  };

  // Reset current question
  const handleResetQuestion = () => {
    onSetRevealedCount(1);
    onSetClueRevealed(false);
    onSetAnswerRevealed(false);
    onSetTimerSeconds(20);
    onSetTimerRunning(false);
    setCelebrationConfetti([]);
    sound.playClick();
  };

  // Trigger Next Question Screen (which does transition)
  const handleNextQuestion = () => {
    onNextQuestionTrigger();
  };

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#02040a] p-6 text-center">
        <h2 className="text-2xl font-black font-mono tracking-widest text-red-500 mb-4">
          NO QUESTIONS FOUND
        </h2>
        <p className="text-gray-400 font-mono mb-6">
          Add questions first using the Organizer Dashboard.
        </p>
        <button 
          onClick={onBackToSelection}
          className="px-6 py-3 bg-slate-900 border border-white/10 rounded-xl text-white font-mono tracking-widest hover:bg-slate-800"
        >
          BACK TO SELECTION
        </button>
      </div>
    );
  }

  // Clue display character helper
  const renderClueWord = () => {
    const letters = Array.from(question.answer);
    return (
      <div className="flex flex-wrap justify-center gap-1.5 md:gap-3 py-4 select-none">
        {letters.map((char, index) => {
          if (char === ' ') {
            return <div key={index} className="w-6 sm:w-10" />; // blank spacer for word break
          }
          const isHidden = question.hiddenLetters.includes(index);
          const showLetter = isAnswerRevealed || (isClueRevealed && !isHidden);
          
          return (
            <div 
              key={index}
              className={`w-9 h-12 sm:w-14 sm:h-18 rounded-xl border flex items-center justify-center font-black text-xl sm:text-3xl font-mono tracking-tighter transition-all duration-500 shadow-md ${
                isAnswerRevealed 
                  ? 'bg-gradient-to-b from-yellow-400 to-amber-500 border-yellow-300 text-slate-950 scale-105' 
                  : showLetter 
                    ? 'bg-slate-900 border-cyan-400/50 text-cyan-400' 
                    : 'bg-slate-950/80 border-slate-800 text-slate-600'
              }`}
            >
              {showLetter ? char : '_'}
            </div>
          );
        })}
      </div>
    );
  };

  // Border style definitions
  const futuristicBorder = playfulStyle 
    ? "border-2 border-dashed border-amber-500/40 bg-slate-950/80 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.05)]"
    : "border border-cyan-500/30 bg-slate-950/80 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.05)]";

  return (
    <div 
      id="ctrl-guess-game-wrapper"
      className={`relative w-full min-h-screen flex flex-col justify-between bg-[#030611] text-white overflow-hidden transition-all duration-500 ${
        isFullScreen ? 'p-4 md:p-8' : 'p-6 md:p-10'
      }`}
    >
      {/* Dynamic Backgrounds */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      {/* Confetti Celebration overlays */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {celebrationConfetti.map((c) => (
          <motion.div
            key={c.id}
            className="absolute rounded-sm"
            style={{
              left: `${c.x}%`,
              top: `${c.y}%`,
              width: `${c.size}px`,
              height: `${c.size * 1.5}px`,
              backgroundColor: c.color,
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [`${c.x}%`, `${c.x + (Math.sin(c.id) * 15)}%`],
              rotate: [0, 360 + c.id * 10],
            }}
            transition={{
              duration: Math.random() * 3 + 2.5,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* TOP HEADER SECTION */}
      <div className="w-full flex justify-between items-center z-10 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { sound.playClick(); onBackToSelection(); }}
            className="px-4 py-2 text-xs font-mono tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            ← LEAVE GAME
          </button>
          
          <span className={`text-xs font-mono tracking-widest border rounded-full px-4 py-1 font-bold ${
            playfulStyle 
              ? 'text-amber-400 border-amber-500/30 bg-amber-950/20' 
              : 'text-cyan-400 border-cyan-500/30 bg-cyan-950/20'
          }`}>
            ROUND 0{question.round}
          </span>

          <span className={`text-[10px] font-mono tracking-widest px-3 py-1 rounded-full border border-white/10 ${
            question.difficulty === 'EASY' ? 'text-emerald-400 bg-emerald-950/10' :
            question.difficulty === 'MEDIUM' ? 'text-amber-400 bg-amber-950/10' :
            'text-rose-400 bg-rose-950/10'
          }`}>
            {question.difficulty} DIFFICULTY
          </span>
        </div>

        {/* Central Title */}
        <div className="text-center hidden lg:block">
          <h1 className={`text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r ${
            playfulStyle ? 'from-amber-400 to-orange-500' : 'from-cyan-400 to-blue-500'
          }`}>
            {gameTitle}
          </h1>
          <p className="text-[10px] text-gray-400 font-mono tracking-wider">
            {subtitle}
          </p>
        </div>

        {/* Top Right Timer and Screen Toggles */}
        <div className="flex items-center gap-4">
          
          {/* Circular Countdown Timer */}
          <div className="relative w-14 h-14 flex items-center justify-center group">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="28" cy="28" r="24" className="stroke-slate-800 fill-none" strokeWidth="4" />
              <circle 
                cx="28" 
                cy="28" 
                r="24" 
                className={`fill-none transition-all duration-1000 ${
                  timerSeconds <= 5 ? 'stroke-red-500 animate-pulse' : playfulStyle ? 'stroke-amber-400' : 'stroke-cyan-400'
                }`}
                strokeWidth="4" 
                strokeDasharray="150.8"
                strokeDashoffset={150.8 - (150.8 * timerSeconds) / 20}
              />
            </svg>
            <span className={`text-base font-black font-mono ${
              timerSeconds <= 5 ? 'text-red-500 animate-ping absolute' : ''
            }`} />
            <span className={`text-lg font-black font-mono z-10 ${
              timerSeconds <= 5 ? 'text-red-500' : 'text-white'
            }`}>
              {timerSeconds}
            </span>
          </div>

          {/* Full Screen Toggle button */}
          <button
            onClick={() => { sound.playClick(); onToggleFullScreen(); }}
            className="p-2 text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            title={isFullScreen ? "Exit Projector Mode" : "Enter Projector Mode"}
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3 IMAGE CLUES CONTAINER (16:9 Projector Friendly) */}
      <div className="flex-grow flex flex-col justify-center items-center z-10 w-full max-w-6xl mx-auto py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center w-full relative">
          
          {/* Card 1 */}
          <div className="relative aspect-[16/10] md:aspect-[4/3] w-full flex items-center justify-center">
            <div className={`absolute inset-0 w-full h-full overflow-hidden ${futuristicBorder} flex items-center justify-center`}>
              <img 
                src={question.images[0]} 
                alt="Clue 1" 
                className="w-full h-full object-cover rounded-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80';
                }}
              />
              {/* Overlay with number */}
              <div className="absolute top-3 left-3 bg-slate-950/80 px-3 py-1 rounded-full font-mono text-xs text-white border border-white/10">
                CLUE 1
              </div>
            </div>
          </div>

          {/* Plus separator 1 */}
          <div className="hidden md:flex justify-center items-center absolute left-[31%] z-20">
            <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-yellow-300 font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              +
            </span>
          </div>

          {/* Card 2 */}
          <div className="relative aspect-[16/10] md:aspect-[4/3] w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {revealedCount >= 2 ? (
                <motion.div 
                  initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                  animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                  exit={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 80, damping: 12 }}
                  className={`absolute inset-0 w-full h-full overflow-hidden ${futuristicBorder} flex items-center justify-center`}
                >
                  <img 
                    src={question.images[1]} 
                    alt="Clue 2" 
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 px-3 py-1 rounded-full font-mono text-xs text-white border border-white/10">
                    CLUE 2
                  </div>
                </motion.div>
              ) : (
                <div className={`absolute inset-0 w-full h-full ${futuristicBorder} bg-gradient-to-b from-[#0b1329] to-[#040812] flex flex-col items-center justify-center border-slate-800`}>
                  <Lock className={`w-12 h-12 ${playfulStyle ? 'text-amber-500/40' : 'text-cyan-500/40'} mb-2`} />
                  <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">IMAGE LOCKED</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Plus separator 2 */}
          <div className="hidden md:flex justify-center items-center absolute left-[65%] z-20">
            <span className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 text-yellow-300 font-black text-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]">
              +
            </span>
          </div>

          {/* Card 3 */}
          <div className="relative aspect-[16/10] md:aspect-[4/3] w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {revealedCount >= 3 ? (
                <motion.div 
                  initial={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                  animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                  exit={{ rotateY: 180, scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 80, damping: 12 }}
                  className={`absolute inset-0 w-full h-full overflow-hidden ${futuristicBorder} flex items-center justify-center`}
                >
                  <img 
                    src={question.images[2]} 
                    alt="Clue 3" 
                    className="w-full h-full object-cover rounded-2xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 px-3 py-1 rounded-full font-mono text-xs text-white border border-white/10">
                    CLUE 3
                  </div>
                </motion.div>
              ) : (
                <div className={`absolute inset-0 w-full h-full ${futuristicBorder} bg-gradient-to-b from-[#0b1329] to-[#040812] flex flex-col items-center justify-center border-slate-800`}>
                  <Lock className={`w-12 h-12 ${playfulStyle ? 'text-amber-500/40' : 'text-cyan-500/40'} mb-2`} />
                  <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">IMAGE LOCKED</span>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* REVEAL BAR BUTTON (Centered if locked images exist) */}
        {revealedCount < 3 && (
          <motion.button
            id="btn-reveal-next-image"
            onClick={handleRevealNextImage}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`mt-6 px-8 py-3.5 rounded-full font-black text-sm tracking-widest cursor-pointer shadow-lg flex items-center gap-2 border ${
              playfulStyle 
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/10' 
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 border-cyan-300 shadow-cyan-500/10'
            }`}
          >
            <Unlock className="w-4 h-4 fill-current" />
            REVEAL IMAGE {revealedCount + 1} OF 3
          </motion.button>
        )}
      </div>

      {/* CLUE AND HIDDEN-LETTER LAYOUT SECTION */}
      <div className="w-full z-10 text-center max-w-5xl mx-auto py-2">
        <h4 className="text-[10px] md:text-xs font-mono tracking-[0.4em] text-slate-400 uppercase mb-2">
          GUESS THE TECHNICAL WORD
        </h4>
        
        {/* Underline Layout clues */}
        {renderClueWord()}

        {/* Revealed Clue text overlay */}
        <AnimatePresence>
          {isClueRevealed && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 px-6 py-3 rounded-xl bg-slate-950/90 border border-yellow-500/10 inline-block max-w-2xl text-center"
            >
              <span className="text-xs font-mono tracking-widest text-yellow-400 font-bold uppercase block mb-1">
                ORGANIZER CLUE HINT:
              </span>
              <p className="text-sm md:text-base font-bold text-gray-200">
                "{question.clue}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROL ACTIONS TOOLBAR FOR THE ORGANIZER / HOST */}
      <div className={`w-full z-10 flex flex-wrap justify-between items-center gap-4 mt-6 border-t border-white/5 ${
        isFullScreen ? 'pt-4' : 'pt-6'
      }`}>
        {/* Timer Control panel */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => { sound.playClick(); onSetTimerRunning(!isTimerRunning); }}
            className={`p-2.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isTimerRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isTimerRunning ? "Pause Timer" : "Start Timer"}
          >
            {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          
          <button
            onClick={handleResetQuestion}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-gray-400 hover:text-white cursor-pointer transition-colors"
            title="Reset Question State"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Game revealing controls */}
        <div className="flex items-center gap-3">
          {/* Reveal Clue */}
          <button
            id="btn-reveal-clue"
            onClick={handleRevealClue}
            disabled={isClueRevealed}
            className={`px-5 py-3 rounded-xl text-xs font-bold font-mono tracking-widest cursor-pointer border transition-all ${
              isClueRevealed 
                ? 'bg-slate-900/50 border-white/5 text-gray-600 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 inline mr-1.5" /> REVEAL CLUE
          </button>

          {/* Show Answer */}
          <button
            id="btn-show-answer"
            onClick={handleShowAnswer}
            disabled={isAnswerRevealed}
            className={`px-6 py-3 rounded-xl text-xs font-black font-mono tracking-widest cursor-pointer border transition-all ${
              isAnswerRevealed 
                ? 'bg-slate-900/50 border-white/5 text-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-yellow-500 to-amber-500 border-yellow-300 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1.5 fill-current" /> SHOW ANSWER
          </button>
        </div>

        {/* Next Question */}
        <button
          id="btn-next-question"
          onClick={handleNextQuestion}
          className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-bold font-mono tracking-widest text-white hover:border-white/30 flex items-center gap-1.5 cursor-pointer"
        >
          NEXT QUESTION
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

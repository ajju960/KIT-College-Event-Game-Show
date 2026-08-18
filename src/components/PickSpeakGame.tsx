/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Actor } from '../types';
import { sound } from '../utils/sound';
import { 
  Disc, Play, Pause, RotateCcw, Volume2, Sparkles, Mic, HelpCircle, AlertCircle, ChevronRight, Maximize2, Minimize2
} from 'lucide-react';

interface PickSpeakGameProps {
  actors: Actor[];
  spinningTime: number;
  speakingTime: number;
  selectedActorId: string | null;
  wheelRotation: number;
  isSpinning: boolean;
  speakingSecondsLeft: number;
  isSpeakingTimerRunning: boolean;
  speakingTimerPaused: boolean;
  speakerScreenActive: boolean;
  isFullScreen: boolean;
  onSetSelectedActorId: (id: string | null) => void;
  onSetWheelRotation: (rot: number) => void;
  onSetIsSpinning: (spin: boolean) => void;
  onSetSpeakingSecondsLeft: (sec: number | ((prev: number) => number)) => void;
  onSetIsSpeakingTimerRunning: (run: boolean) => void;
  onSetSpeakingTimerPaused: (paused: boolean) => void;
  onSetSpeakerScreenActive: (act: boolean) => void;
  onToggleFullScreen: () => void;
  onNextChallengeTrigger: () => void;
  onBackToSelection: () => void;
}

export default function PickSpeakGame({
  actors,
  spinningTime,
  speakingTime,
  selectedActorId,
  wheelRotation,
  isSpinning,
  speakingSecondsLeft,
  isSpeakingTimerRunning,
  speakingTimerPaused,
  speakerScreenActive,
  isFullScreen,
  onSetSelectedActorId,
  onSetWheelRotation,
  onSetIsSpinning,
  onSetSpeakingSecondsLeft,
  onSetIsSpeakingTimerRunning,
  onSetSpeakingTimerPaused,
  onSetSpeakerScreenActive,
  onToggleFullScreen,
  onNextChallengeTrigger,
  onBackToSelection,
}: PickSpeakGameProps) {

  const activeActors = actors.filter(a => a.enabled && a.image);
  const [spinPhase, setSpinPhase] = useState<'IDLE' | 'SPINNING' | 'REVEALING' | 'SPEAKING'>('IDLE');
  const [localTimer, setLocalTimer] = useState(speakingTime);
  const [micPulse, setMicPulse] = useState(false);

  // Audio spinning tick tracking
  const lastTickAngleRef = useRef(0);

  useEffect(() => {
    if (speakerScreenActive) {
      setSpinPhase('SPEAKING');
    } else if (selectedActorId) {
      setSpinPhase('REVEALING');
    } else {
      setSpinPhase('IDLE');
    }
  }, [speakerScreenActive, selectedActorId]);

  // Speaking Countdown Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isSpeakingTimerRunning && !speakingTimerPaused) {
      interval = setInterval(() => {
        onSetSpeakingSecondsLeft((prev) => {
          if (prev <= 1) {
            onSetIsSpeakingTimerRunning(false);
            sound.playBuzzer();
            return 0;
          }
          if (prev <= 10) {
            sound.playTick(); // sound warning
          } else {
            sound.playClick();
          }
          return prev - 1;
        });
        setMicPulse(p => !p);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpeakingTimerRunning, speakingTimerPaused]);

  // Spin the Wheel math
  const handleSpinWheel = () => {
    if (activeActors.length === 0) {
      alert('Configure active actors first in the Organizer Dashboard!');
      return;
    }
    if (isSpinning) return;

    sound.playClick();
    onSetSelectedActorId(null);
    onSetSpeakerScreenActive(false);
    onSetIsSpinning(true);
    setSpinPhase('SPINNING');

    // Random active actor selection
    const randomIndex = Math.floor(Math.random() * activeActors.length);
    const chosenActor = activeActors[randomIndex];
    
    // Find its slot index in the full list (0 to 5) so we stop exactly on its slice
    const slotIndex = actors.findIndex(a => a.id === chosenActor.id);

    // Calculate rotation to land slotIndex at top pointer (270 degrees)
    // 360 / 6 slices = 60 degrees per slice.
    // Slices are drawn at center angles:
    // Slot 0: 30 deg, Slot 1: 90 deg, Slot 2: 150 deg, Slot 3: 210 deg, Slot 4: 270 deg, Slot 5: 330 deg.
    // To center Slot S at pointer (270 degrees/12 o'clock in cartesian screen coordinate, wait: standard SVG pointer is at 90 deg or top which is 270 deg)
    // We want to rotate Slot S to the top pointer.
    // Top pointer corresponds to rotation target -90 degrees or 270 degrees.
    // A slice at center angle A should land at top pointer. So rotation = 270 - A.
    // Center angle A for slotIndex is S * 60 + 30.
    // E.g. Slot 0 is centered at 30 deg. Rotation = 270 - 30 = 240 deg.
    // Slot 3 is centered at 210 deg. Rotation = 270 - 210 = 60 deg.
    const sliceAngle = slotIndex * 60 + 30;
    const stopAngle = (270 - sliceAngle + 360) % 360;
    
    // Add multiple spins (e.g. 5-7 spins)
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const newRotation = wheelRotation + extraSpins + stopAngle - (wheelRotation % 360);

    onSetWheelRotation(newRotation);

    // Realistic ticking sound effect during rotation
    let durationMs = spinningTime * 1000;
    let startTime = Date.now();
    
    const playTickRoutine = () => {
      let elapsed = Date.now() - startTime;
      if (elapsed < durationMs) {
        sound.playSpinClick();
        // Slow down ticks as time increases
        let speedFactor = elapsed / durationMs; // 0 to 1
        let nextTickDelay = 40 + speedFactor * 400; // quadratic slow down
        setTimeout(playTickRoutine, nextTickDelay);
      }
    };
    playTickRoutine();

    // End spinning callback
    setTimeout(() => {
      onSetIsSpinning(false);
      onSetSelectedActorId(chosenActor.id);
      setSpinPhase('REVEALING');
      sound.playSuccess();
    }, durationMs);
  };

  const handleStartSpeaking = () => {
    onSetSpeakingSecondsLeft(speakingTime);
    onSetIsSpeakingTimerRunning(true);
    onSetSpeakingTimerPaused(false);
    onSetSpeakerScreenActive(true);
    setSpinPhase('SPEAKING');
    sound.playExplosion();
  };

  const handlePauseResumeSpeaking = () => {
    onSetSpeakingTimerPaused(!speakingTimerPaused);
    sound.playClick();
  };

  const handleSkipActor = () => {
    if (!window.confirm('Are you sure you want to skip this actor selection?')) return;
    onSetSelectedActorId(null);
    onSetSpeakerScreenActive(false);
    onSetIsSpeakingTimerRunning(false);
    setSpinPhase('IDLE');
    sound.playBuzzer();
  };

  const handleNextChallenge = () => {
    onNextChallengeTrigger();
  };

  const handleResetChallenge = () => {
    onSetSelectedActorId(null);
    onSetSpeakerScreenActive(false);
    onSetIsSpeakingTimerRunning(false);
    setSpinPhase('IDLE');
    sound.playClick();
  };

  const selectedActor = actors.find(a => a.id === selectedActorId);

  // SVG slice coordinates calculation for the 6-slice wheel
  const getWedgePath = (startAngle: number, endAngle: number) => {
    const radius = 175;
    const cx = 200;
    const cy = 200;
    
    const rad = (deg: number) => (deg * Math.PI) / 180;
    
    const x1 = cx + radius * Math.cos(rad(startAngle));
    const y1 = cy + radius * Math.sin(rad(startAngle));
    const x2 = cx + radius * Math.cos(rad(endAngle));
    const y2 = cy + radius * Math.sin(rad(endAngle));
    
    return `M ${cx},${cy} L ${x1},${y1} A ${radius},${radius} 0 0,1 ${x2},${y2} Z`;
  };

  return (
    <div 
      id="pick-speak-game-wrapper"
      className={`relative w-full min-h-screen flex flex-col justify-between bg-[#05030d] text-white overflow-hidden ${
        isFullScreen ? 'p-4 md:p-8' : 'p-6 md:p-10'
      }`}
    >
      {/* Background neon radial colors */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-pink-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      {/* TOP HEADER SECTION */}
      <div className="w-full flex justify-between items-center z-10 mb-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { sound.playClick(); onBackToSelection(); }}
            className="px-4 py-2 text-xs font-mono tracking-widest text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            ← LEAVE GAME
          </button>
          
          <span className="text-xs font-mono tracking-widest border border-pink-500/30 rounded-full px-4 py-1 bg-pink-950/20 text-pink-400 font-bold">
            STAGE 03 - ACTOR SPIN
          </span>
          <span className="text-[10px] text-gray-500 font-mono hidden md:inline">
            ACTIVE SLOTS: {activeActors.length}/6
          </span>
        </div>

        {/* Central Title */}
        <div className="text-center hidden lg:block">
          <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-500">
            PICK & SPEAK
          </h1>
          <p className="text-[10px] text-gray-400 font-mono tracking-wider">
            SPIN THE THEATRICAL WHEEL • GET AN ACTOR • TALK ON STAGE
          </p>
        </div>

        {/* Top Right Controls */}
        <button
          onClick={() => { sound.playClick(); onToggleFullScreen(); }}
          className="p-2 text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          title={isFullScreen ? "Exit Projector Mode" : "Enter Projector Mode"}
        >
          {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* MAIN SCREEN INTERACTIVE PRESENTATION */}
      <div className="flex-grow flex items-center justify-center z-10 max-w-6xl mx-auto w-full py-4">
        
        {/* PHASE 1: SPINNING WHEEL MODE */}
        {spinPhase === 'IDLE' && (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 w-full py-4">
            
            {/* Spinning Wheel Column */}
            <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] flex items-center justify-center">
              
              {/* Outer Pointer Indicator (top centered) */}
              <div className="absolute top-[-15px] z-30 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-pink-500 drop-shadow-[0_4px_10px_rgba(236,72,153,0.5)]" />
                <div className="w-3 h-3 rounded-full bg-pink-400 -mt-1 animate-ping" />
              </div>

              {/* Glowing outer circle case */}
              <div className="absolute inset-0 rounded-full border-4 border-pink-500/30 shadow-[0_0_40px_rgba(236,72,153,0.2)] animate-pulse" />

              {/* SVG wheel element */}
              <motion.svg
                width="100%"
                height="100%"
                viewBox="0 0 400 400"
                style={{ originX: '50%', originY: '50%' }}
                animate={{ rotate: wheelRotation }}
                transition={isSpinning ? {
                  duration: spinningTime,
                  ease: [0.15, 0.85, 0.35, 1], // Realistic deceleration easing curve
                } : { duration: 0 }}
                className="relative z-10 w-full h-full drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]"
              >
                {/* 6 slice segments */}
                {Array.from({ length: 6 }).map((_, i) => {
                  const startAngle = i * 60;
                  const endAngle = (i + 1) * 60;
                  const colors = [
                    ['#ec4899', '#f43f5e'], // Pink/Rose
                    ['#d946ef', '#a855f7'], // Fuchsia/Purple
                    ['#3b82f6', '#06b6d4'], // Blue/Cyan
                    ['#10b981', '#14b8a6'], // Emerald/Teal
                    ['#f59e0b', '#f97316'], // Amber/Orange
                    ['#ef4444', '#ea580c'], // Red/Orange
                  ];
                  const currentColors = colors[i % colors.length];
                  
                  const textRad = ((startAngle + endAngle) / 2 * Math.PI) / 180;
                  const textRadius = 110;
                  const textX = 200 + textRadius * Math.cos(textRad);
                  const textY = 200 + textRadius * Math.sin(textRad);
                  const textRot = (startAngle + endAngle) / 2 + 90; // Rotate text to center outward

                  const actorSlot = actors[i];
                  const hasActor = actorSlot && actorSlot.image && actorSlot.name !== 'Empty Slot';

                  return (
                    <g key={i}>
                      {/* Segment Slice Wedge */}
                      <path
                        d={getWedgePath(startAngle, endAngle)}
                        fill={currentColors[0]}
                        stroke="#05030d"
                        strokeWidth="4"
                        className="opacity-90"
                      />
                      
                      {/* Inner glow line divider */}
                      <line
                        x1="200" y1="200"
                        x2={200 + 175 * Math.cos((startAngle * Math.PI) / 180)}
                        y2={200 + 175 * Math.sin((startAngle * Math.PI) / 180)}
                        stroke={currentColors[1]}
                        strokeWidth="1.5"
                        opacity="0.5"
                      />

                      {/* Display Actor Details inside Slice */}
                      <g transform={`translate(${textX}, ${textY}) rotate(${textRot})`}>
                        {hasActor ? (
                          <>
                            {/* Shortened Name text */}
                            <text
                              x="0"
                              y="20"
                              textAnchor="middle"
                              fill="#ffffff"
                              fontFamily="'Inter', sans-serif"
                              fontWeight="900"
                              fontSize="11.5"
                              letterSpacing="0.5"
                              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                            >
                              {actorSlot.name.split(' ').pop()?.toUpperCase()}
                            </text>
                            
                            {/* Inner circle slot */}
                            <circle cx="0" cy="-15" r="18" fill="#0c0a1a" stroke="#ffffff" strokeWidth="1.5" />
                            <clipPath id={`clip-slice-${i}`}>
                              <circle cx="0" cy="-15" r="17" />
                            </clipPath>
                            <image
                              href={actorSlot.image}
                              x="-17"
                              y="-32"
                              width="34"
                              height="34"
                              clipPath={`url(#clip-slice-${i})`}
                              preserveAspectRatio="xMidYMid slice"
                            />
                          </>
                        ) : (
                          <text
                            x="0"
                            y="0"
                            textAnchor="middle"
                            fill="#ffffff"
                            opacity="0.3"
                            fontFamily="'Inter', sans-serif"
                            fontWeight="800"
                            fontSize="9"
                            letterSpacing="1"
                          >
                            EMPTY SLOT
                          </text>
                        )}
                      </g>
                    </g>
                  );
                })}

                {/* Outer bounding circle strip */}
                <circle cx="200" cy="200" r="175" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.15" />

                {/* Center Hub Badge Pin */}
                <circle cx="200" cy="200" r="34" fill="#05030d" stroke="#ec4899" strokeWidth="4" />
                <circle cx="200" cy="200" r="26" fill="#18142c" />
                
                {/* Tiny mic icon in hub center */}
                <g transform="translate(191, 191)">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" fill="#ec4899" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" fill="none" />
                  <line x1="12" x2="12" y1="19" y2="22" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                </g>
              </motion.svg>
            </div>

            {/* Instruction Column */}
            <div className="flex-1 max-w-md text-center lg:text-left space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-widest text-white leading-tight">
                SPIN TO CHOOSE THE ACTOR
              </h2>
              <p className="text-sm text-gray-400 font-mono leading-relaxed">
                Invite a participant to the stage. Click the button to launch the high-speed spinning wheel of South Indian stars.
              </p>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
                <span className="text-[10px] font-mono tracking-widest text-pink-400 font-bold block">
                  CONFIGURED TIMERS:
                </span>
                <p className="text-xs text-gray-300 font-mono">
                  • Spinning Wheel Time: <strong className="text-pink-300">{spinningTime} Seconds</strong><br />
                  • Speaking Timer Round: <strong className="text-pink-300">{speakingTime} Seconds</strong>
                </p>
              </div>

              <motion.button
                id="btn-spin-wheel"
                onClick={handleSpinWheel}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(236,72,153,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black tracking-widest text-lg shadow-[0_0_20px_rgba(236,72,153,0.3)] border border-pink-400 cursor-pointer"
              >
                SPIN THE WHEEL
              </motion.button>
            </div>
            
          </div>
        )}

        {/* PHASE 2: WHEEL ACTIVE SPINNING STATE */}
        {spinPhase === 'SPINNING' && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] flex items-center justify-center animate-pulse">
              
              {/* Spinning pointer glow */}
              <div className="absolute top-[-15px] z-30">
                <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-t-[25px] border-l-transparent border-r-transparent border-t-pink-500 animate-bounce" />
              </div>

              {/* Duplicate Wheel to preserve spinning rendering */}
              <motion.svg
                width="100%"
                height="100%"
                viewBox="0 0 400 400"
                style={{ originX: '50%', originY: '50%' }}
                animate={{ rotate: wheelRotation }}
                transition={{
                  duration: spinningTime,
                  ease: [0.15, 0.85, 0.35, 1],
                }}
                className="w-full h-full"
              >
                {/* Standard 6 slice renderings */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <path
                    key={i}
                    d={getWedgePath(i * 60, (i + 1) * 60)}
                    fill={['#ec4899', '#d946ef', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 6]}
                    stroke="#05030d"
                    strokeWidth="4"
                    opacity="0.85"
                  />
                ))}
                {/* Center Hub Pin */}
                <circle cx="200" cy="200" r="34" fill="#05030d" stroke="#ec4899" strokeWidth="4" />
              </motion.svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-widest text-pink-400 animate-pulse uppercase">
                SPINNING WHEEL LIVE...
              </h2>
              <p className="text-xs font-mono text-gray-500 tracking-[0.3em] uppercase">
                DETERMINING ACTOR TARGET FROM MIXER...
              </p>
            </div>
          </div>
        )}

        {/* PHASE 3: RANDOM ACTOR SELECTION REVEAL */}
        {spinPhase === 'REVEALING' && selectedActor && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center max-w-2xl py-6 space-y-6"
          >
            <span className="text-xs font-mono tracking-[0.4em] text-pink-400 font-bold uppercase animate-bounce">
              YOUR SELECTED ACTOR IS...
            </span>

            {/* Glowing Big Actor Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-radial-gradient from-pink-500/20 to-transparent blur-2xl animate-pulse pointer-events-none" />
              
              {/* Actor Headshot */}
              <motion.div 
                initial={{ rotate: -5, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 10 }}
                className="w-64 h-64 md:w-80 md:h-80 rounded-2xl border-2 border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.3)] overflow-hidden bg-slate-900"
              >
                <img 
                  src={selectedActor.image} 
                  alt={selectedActor.name} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Shiny crown decoration */}
              <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-400 p-1.5 rounded-lg border border-yellow-300 shadow-md">
                <Sparkles className="w-5 h-5 text-slate-950" />
              </div>
            </div>

            {/* Selected Actor Name display */}
            <div className="space-y-1">
              <h2 className="text-3xl md:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 drop-shadow-md">
                {selectedActor.name}
              </h2>
              <p className="text-xs font-mono text-gray-500 tracking-widest uppercase">
                TAMIL CINEMA SUPERSTAR
              </p>
            </div>

            {/* Action buttons to start speaking round */}
            <div className="flex flex-col sm:flex-row gap-4 w-full pt-4">
              <button
                onClick={handleSkipActor}
                className="px-6 py-4 rounded-xl border border-white/10 hover:bg-white/5 font-bold font-mono text-xs tracking-widest text-gray-400 hover:text-white flex-1 cursor-pointer"
              >
                SKIP / SPIN AGAIN
              </button>
              
              <button
                id="btn-start-speaking"
                onClick={handleStartSpeaking}
                className="px-10 py-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black tracking-widest text-xs border border-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.3)] flex-grow cursor-pointer"
              >
                START SPEAKING ROUND!
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 4: ACTIVE SPEAKING COUNTDOWN MODE */}
        {spinPhase === 'SPEAKING' && selectedActor && (
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full py-4">
            
            {/* Spotlight Column */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {/* Spotlight glowing border */}
                <div className="absolute inset-[-4px] rounded-2xl bg-gradient-to-b from-pink-500 to-purple-500 blur-md opacity-70 animate-pulse pointer-events-none" />
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl border-2 border-white overflow-hidden relative z-10 bg-slate-900 shadow-2xl">
                  <img src={selectedActor.image} alt={selectedActor.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">
                  {selectedActor.name}
                </h3>
                <span className="text-[10px] font-mono tracking-widest text-pink-400 font-bold uppercase block mt-1">
                  CURRENTLY ON STAGE
                </span>
              </div>
            </div>

            {/* Timer Countdown Column */}
            <div className="flex-1 max-w-md flex flex-col items-center justify-center space-y-6">
              
              {/* Mic Icon Speaking Indicator */}
              <div className="flex flex-col items-center justify-center gap-2">
                <motion.div 
                  animate={isSpeakingTimerRunning && !speakingTimerPaused ? {
                    scale: [1, 1.15, 1],
                    boxShadow: ["0 0 10px rgba(236,72,153,0.3)", "0 0 30px rgba(236,72,153,0.6)", "0 0 10px rgba(236,72,153,0.3)"]
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="p-5 rounded-full bg-slate-950 border border-pink-500/30 text-pink-400"
                >
                  <Mic className="w-8 h-8" />
                </motion.div>
                <span className="text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                  {isSpeakingTimerRunning && !speakingTimerPaused ? 'SPEAK NOW / LIVE MIC' : 'ROUND PAUSED'}
                </span>
              </div>

              {/* Large Speaking Countdown display */}
              <div className="text-center space-y-1">
                {speakingSecondsLeft === 0 ? (
                  <motion.h2 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-5xl md:text-6xl font-black tracking-wider text-red-500 font-mono drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                  >
                    TIME'S UP!
                  </motion.h2>
                ) : (
                  <h2 className={`text-6xl md:text-8xl font-black font-mono tracking-tight ${
                    speakingSecondsLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'
                  }`}>
                    {Math.floor(speakingSecondsLeft / 60)}:{(speakingSecondsLeft % 60).toString().padStart(2, '0')}
                  </h2>
                )}
                <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block">
                  STAGE TIME LIMIT COUNTDOWN
                </span>
              </div>

              {/* Timer Progress Bar */}
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{ width: `${(speakingSecondsLeft / speakingTime) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Host timer controls */}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handlePauseResumeSpeaking}
                  disabled={speakingSecondsLeft === 0}
                  className={`py-3.5 rounded-xl text-xs font-bold font-mono tracking-widest flex-1 cursor-pointer transition-colors ${
                    speakingSecondsLeft === 0 
                      ? 'bg-slate-900 border-white/5 text-gray-600 cursor-not-allowed'
                      : speakingTimerPaused 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                        : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {speakingTimerPaused ? 'RESUME TIMER' : 'PAUSE TIMER'}
                </button>

                <button
                  onClick={() => { sound.playClick(); onSetSpeakingSecondsLeft(speakingTime); }}
                  className="px-4 py-3.5 bg-slate-900 hover:bg-slate-850 rounded-xl text-gray-400 hover:text-white cursor-pointer"
                  title="Reset Stage Time"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* CORE HOST OPERATIONS ROW (Hides inside specific animation phases if useful) */}
      <div className="w-full z-10 flex flex-wrap justify-between items-center gap-4 mt-6 border-t border-white/5 pt-6">
        
        {/* Reset wheel stage */}
        <button
          onClick={handleResetChallenge}
          disabled={spinPhase === 'IDLE' || spinPhase === 'SPINNING'}
          className={`px-5 py-3 rounded-xl text-xs font-bold font-mono tracking-widest cursor-pointer border transition-all ${
            spinPhase === 'IDLE' || spinPhase === 'SPINNING'
              ? 'bg-slate-900/50 border-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-slate-950 hover:bg-slate-900 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          RESET CHALLENGE
        </button>

        {/* Spin Again */}
        <button
          onClick={handleResetChallenge}
          disabled={spinPhase !== 'REVEALING' && spinPhase !== 'SPEAKING'}
          className={`px-6 py-3 rounded-xl text-xs font-bold font-mono tracking-widest cursor-pointer border transition-all ${
            spinPhase !== 'REVEALING' && spinPhase !== 'SPEAKING'
              ? 'bg-slate-900/50 border-white/5 text-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white'
          }`}
        >
          SPIN AGAIN
        </button>

        {/* Next challenge transition trigger */}
        <button
          id="btn-next-challenge"
          onClick={handleNextChallenge}
          className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-xs font-bold font-mono tracking-widest text-white hover:border-white/30 flex items-center gap-1.5 cursor-pointer"
        >
          NEXT CHALLENGE
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Question, Actor, GameType } from './types';
import { defaultCtrlGuessQuestions, defaultGuessPannuBroQuestions } from './data/defaultQuestions';
import { defaultActors } from './data/defaultActors';
import { sound } from './utils/sound';
import { loadGameDataFromCloud, saveGameDataToCloud, subscribeToGameDataFromCloud } from './utils/firebase';

// Components
import WelcomePage from './components/WelcomePage';
import GameSelection from './components/GameSelection';
import CtrlGuessGame from './components/CtrlGuessGame';
import GuessPannuBroGame from './components/GuessPannuBroGame';
import PickSpeakGame from './components/PickSpeakGame';
import TransitionScreen from './components/TransitionScreen';
import AdminPanel from './components/AdminPanel';
import CollegeLogo from './components/CollegeLogo';

// Icons
import { Trophy, ArrowLeft, RefreshCw, Sparkles, Star } from 'lucide-react';

export default function App() {
  // Screen and Game navigation
  const [currentScreen, setCurrentScreen] = useState<'WELCOME' | 'GAME_SELECTION' | 'PLAYING' | 'TRANSITION' | 'COMPLETED'>('WELCOME');
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // General Questions / Content State (Persistent in LocalStorage)
  const [questions1, setQuestions1] = useState<Question[]>([]);
  const [questions2, setQuestions2] = useState<Question[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  
  // Custom durations state
  const [spinningTime, setSpinningTime] = useState(5);
  const [speakingTime, setSpeakingTime] = useState(60);

  // ----------------------------------------------------
  // GAME REPLICATED GAMEPLAY ACTIONS STATE
  // ----------------------------------------------------
  // CTRL_GUESS State
  const [cgIndex, setCgIndex] = useState(0);
  const [cgRevealedCount, setCgRevealedCount] = useState(1);
  const [cgClueRevealed, setCgClueRevealed] = useState(false);
  const [cgAnswerRevealed, setCgAnswerRevealed] = useState(false);
  const [cgTimerSeconds, setCgTimerSeconds] = useState(20);
  const [cgTimerRunning, setCgTimerRunning] = useState(false);

  // GUESS PANNU BRO State
  const [gpIndex, setGpIndex] = useState(0);
  const [gpRevealedCount, setGpRevealedCount] = useState(1);
  const [gpClueRevealed, setGpClueRevealed] = useState(false);
  const [gpAnswerRevealed, setGpAnswerRevealed] = useState(false);
  const [gpTimerSeconds, setGpTimerSeconds] = useState(20);
  const [gpTimerRunning, setGpTimerRunning] = useState(false);

  // PICK & SPEAK State
  const [psSelectedActorId, setPsSelectedActorId] = useState<string | null>(null);
  const [psWheelRotation, setPsWheelRotation] = useState(0);
  const [psIsSpinning, setPsIsSpinning] = useState(false);
  const [psSpeakingSecondsLeft, setPsSpeakingSecondsLeft] = useState(60);
  const [psSpeakingTimerRunning, setPsSpeakingTimerRunning] = useState(false);
  const [psSpeakingTimerPaused, setPsSpeakingTimerPaused] = useState(false);
  const [psSpeakerScreenActive, setPsSpeakerScreenActive] = useState(false);

  // Transition Buffer Trigger
  const [transitionTarget, setTransitionTarget] = useState<'NEXT_Q_CG' | 'NEXT_Q_GP' | 'NEXT_C_PS' | null>(null);

  // ----------------------------------------------------
  // PERSISTENCE - LOADING AND SYNCHRONIZING
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Load Local values first as immediate fallback
    const savedQ1 = localStorage.getItem('kit_game_ctrl_guess_q');
    const savedQ2 = localStorage.getItem('kit_game_guess_pannu_q');
    const savedActors = localStorage.getItem('kit_game_actors');
    const savedSpinTime = localStorage.getItem('kit_game_spin_time');
    const savedSpeakTime = localStorage.getItem('kit_game_speak_time');

    let initialQ1 = savedQ1 ? JSON.parse(savedQ1) : defaultCtrlGuessQuestions;
    let initialQ2 = savedQ2 ? JSON.parse(savedQ2) : defaultGuessPannuBroQuestions;
    let initialActors = savedActors ? JSON.parse(savedActors) : defaultActors;
    let initialSpin = savedSpinTime ? Number(savedSpinTime) : 5;
    let initialSpeak = savedSpeakTime ? Number(savedSpeakTime) : 60;

    setQuestions1(initialQ1);
    setQuestions2(initialQ2);
    setActors(initialActors);
    setSpinningTime(initialSpin);
    setSpeakingTime(initialSpeak);
    setPsSpeakingSecondsLeft(initialSpeak);

    // 2. Try to subscribe to Firestore in real-time
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = subscribeToGameDataFromCloud((cloudData) => {
        if (cloudData) {
          if (cloudData.questions1) {
            setQuestions1(cloudData.questions1);
            localStorage.setItem('kit_game_ctrl_guess_q', JSON.stringify(cloudData.questions1));
          }
          if (cloudData.questions2) {
            setQuestions2(cloudData.questions2);
            localStorage.setItem('kit_game_guess_pannu_q', JSON.stringify(cloudData.questions2));
          }
          if (cloudData.actors) {
            setActors(cloudData.actors);
            localStorage.setItem('kit_game_actors', JSON.stringify(cloudData.actors));
          }
          if (cloudData.spinningTime !== null) {
            setSpinningTime(cloudData.spinningTime);
            localStorage.setItem('kit_game_spin_time', cloudData.spinningTime.toString());
          }
          if (cloudData.speakingTime !== null) {
            setSpeakingTime(cloudData.speakingTime);
            setPsSpeakingSecondsLeft(cloudData.speakingTime);
            localStorage.setItem('kit_game_speak_time', cloudData.speakingTime.toString());
          }
        }
      });
    } catch (err) {
      console.error("Failed to subscribe to cloud data:", err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Trigger synthesized applause track when entering completion screen
  useEffect(() => {
    if (currentScreen === 'COMPLETED') {
      sound.playApplause();
    }
  }, [currentScreen]);

  // Sync state modifications to LocalStorage and Firestore Cloud
  const handleUpdateQuestions1 = (qs: Question[]) => {
    setQuestions1(qs);
    localStorage.setItem('kit_game_ctrl_guess_q', JSON.stringify(qs));
    saveGameDataToCloud(qs, questions2, actors, spinningTime, speakingTime);
  };

  const handleUpdateQuestions2 = (qs: Question[]) => {
    setQuestions2(qs);
    localStorage.setItem('kit_game_guess_pannu_q', JSON.stringify(qs));
    saveGameDataToCloud(questions1, qs, actors, spinningTime, speakingTime);
  };

  const handleUpdateActors = (as: Actor[]) => {
    setActors(as);
    localStorage.setItem('kit_game_actors', JSON.stringify(as));
    saveGameDataToCloud(questions1, questions2, as, spinningTime, speakingTime);
  };

  const handleUpdateSpinningTime = (t: number) => {
    setSpinningTime(t);
    localStorage.setItem('kit_game_spin_time', t.toString());
    saveGameDataToCloud(questions1, questions2, actors, t, speakingTime);
  };

  const handleUpdateSpeakingTime = (t: number) => {
    setSpeakingTime(t);
    setPsSpeakingSecondsLeft(t);
    localStorage.setItem('kit_game_speak_time', t.toString());
    saveGameDataToCloud(questions1, questions2, actors, spinningTime, t);
  };

  // Full Screen Projector Mode handler
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    sound.playClick();
  };

  // ----------------------------------------------------
  // TRANSITIONS AND COUNTDOWNS NAVIGATION SYSTEM
  // ----------------------------------------------------
  const triggerTransition = (target: 'NEXT_Q_CG' | 'NEXT_Q_GP' | 'NEXT_C_PS') => {
    // Pause any active timers
    setCgTimerRunning(false);
    setGpTimerRunning(false);
    setPsSpeakingTimerRunning(false);

    setTransitionTarget(target);
    setCurrentScreen('TRANSITION');
  };

  const handleTransitionComplete = () => {
    if (transitionTarget === 'NEXT_Q_CG') {
      // Advance CTRL_GUESS question
      if (cgIndex + 1 < questions1.length) {
        setCgIndex(cgIndex + 1);
        setCgRevealedCount(1);
        setCgClueRevealed(false);
        setCgAnswerRevealed(false);
        setCgTimerSeconds(20);
        setCgTimerRunning(false);
        setCurrentScreen('PLAYING');
      } else {
        // Complete Game 1
        setCurrentScreen('COMPLETED');
        sound.playSuccess();
      }
    } else if (transitionTarget === 'NEXT_Q_GP') {
      // Advance GUESS_PANNU_BRO question
      if (gpIndex + 1 < questions2.length) {
        setGpIndex(gpIndex + 1);
        setGpRevealedCount(1);
        setGpClueRevealed(false);
        setGpAnswerRevealed(false);
        setGpTimerSeconds(20);
        setGpTimerRunning(false);
        setCurrentScreen('PLAYING');
      } else {
        // Complete Game 2
        setCurrentScreen('COMPLETED');
        sound.playSuccess();
      }
    } else if (transitionTarget === 'NEXT_C_PS') {
      // Return Pick & Speak back to wheel spinning
      setPsSelectedActorId(null);
      setPsSpeakerScreenActive(false);
      setPsSpeakingTimerRunning(false);
      setPsSpeakingSecondsLeft(speakingTime);
      setCurrentScreen('PLAYING');
    }
    setTransitionTarget(null);
  };

  // Reset a game category fully
  const handleRestartCompletedGame = () => {
    sound.playClick();
    if (activeGame === 'CTRL_GUESS') {
      setCgIndex(0);
      setCgRevealedCount(1);
      setCgClueRevealed(false);
      setCgAnswerRevealed(false);
      setCgTimerSeconds(20);
      setCgTimerRunning(false);
    } else if (activeGame === 'GUESS_PANNU_BRO') {
      setGpIndex(0);
      setGpRevealedCount(1);
      setGpClueRevealed(false);
      setGpAnswerRevealed(false);
      setGpTimerSeconds(20);
      setGpTimerRunning(false);
    } else if (activeGame === 'PICK_SPEAK') {
      setPsSelectedActorId(null);
      setPsWheelRotation(0);
      setPsIsSpinning(false);
      setPsSpeakingSecondsLeft(speakingTime);
      setPsSpeakingTimerRunning(false);
      setPsSpeakerScreenActive(false);
    }
    setCurrentScreen('PLAYING');
  };

  return (
    <div className="relative w-full min-h-screen bg-[#02040a] text-white font-sans antialiased">
      <AnimatePresence mode="wait">
        
        {/* SCREEN 1: WELCOME SCREEN */}
        {currentScreen === 'WELCOME' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <WelcomePage onStart={() => setCurrentScreen('GAME_SELECTION')} />
          </motion.div>
        )}

        {/* SCREEN 2: GAME SELECTION */}
        {currentScreen === 'GAME_SELECTION' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <GameSelection 
              onSelectGame={(game) => {
                setActiveGame(game);
                setCurrentScreen('PLAYING');
              }}
              onOpenAdmin={() => setIsAdminOpen(true)}
              onBackToWelcome={() => setCurrentScreen('WELCOME')}
            />
          </motion.div>
        )}

        {/* SCREEN 3: ACTIVE GAMEPLAY SCREEN */}
        {currentScreen === 'PLAYING' && activeGame === 'CTRL_GUESS' && (
          <motion.div
            key="game-ctrl-guess"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <CtrlGuessGame 
              questions={questions1}
              currentQuestionIndex={cgIndex}
              revealedCount={cgRevealedCount}
              isClueRevealed={cgClueRevealed}
              isAnswerRevealed={cgAnswerRevealed}
              timerSeconds={cgTimerSeconds}
              isTimerRunning={cgTimerRunning}
              isFullScreen={isFullScreen}
              onSetRevealedCount={setCgRevealedCount}
              onSetClueRevealed={setCgClueRevealed}
              onSetAnswerRevealed={setCgAnswerRevealed}
              onSetTimerSeconds={setCgTimerSeconds}
              onSetTimerRunning={setCgTimerRunning}
              onToggleFullScreen={handleToggleFullScreen}
              onNextQuestionTrigger={() => triggerTransition('NEXT_Q_CG')}
              onBackToSelection={() => setCurrentScreen('GAME_SELECTION')}
            />
          </motion.div>
        )}

        {/* SCREEN 4: GUESS PANNU BRO */}
        {currentScreen === 'PLAYING' && activeGame === 'GUESS_PANNU_BRO' && (
          <motion.div
            key="game-guess-pannu"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <GuessPannuBroGame 
              questions={questions2}
              currentQuestionIndex={gpIndex}
              revealedCount={gpRevealedCount}
              isClueRevealed={gpClueRevealed}
              isAnswerRevealed={gpAnswerRevealed}
              timerSeconds={gpTimerSeconds}
              isTimerRunning={gpTimerRunning}
              isFullScreen={isFullScreen}
              onSetRevealedCount={setGpRevealedCount}
              onSetClueRevealed={setGpClueRevealed}
              onSetAnswerRevealed={setGpAnswerRevealed}
              onSetTimerSeconds={setGpTimerSeconds}
              onSetTimerRunning={setGpTimerRunning}
              onToggleFullScreen={handleToggleFullScreen}
              onNextQuestionTrigger={() => triggerTransition('NEXT_Q_GP')}
              onBackToSelection={() => setCurrentScreen('GAME_SELECTION')}
            />
          </motion.div>
        )}

        {/* SCREEN 5: PICK & SPEAK */}
        {currentScreen === 'PLAYING' && activeGame === 'PICK_SPEAK' && (
          <motion.div
            key="game-pick-speak"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <PickSpeakGame 
              actors={actors}
              spinningTime={spinningTime}
              speakingTime={speakingTime}
              selectedActorId={psSelectedActorId}
              wheelRotation={psWheelRotation}
              isSpinning={psIsSpinning}
              speakingSecondsLeft={psSpeakingSecondsLeft}
              isSpeakingTimerRunning={psSpeakingTimerRunning}
              speakingTimerPaused={psSpeakingTimerPaused}
              speakerScreenActive={psSpeakerScreenActive}
              isFullScreen={isFullScreen}
              onSetSelectedActorId={setPsSelectedActorId}
              onSetWheelRotation={setPsWheelRotation}
              onSetIsSpinning={setPsIsSpinning}
              onSetSpeakingSecondsLeft={setPsSpeakingSecondsLeft}
              onSetIsSpeakingTimerRunning={setPsSpeakingTimerRunning}
              onSetSpeakingTimerPaused={setPsSpeakingTimerPaused}
              onSetSpeakerScreenActive={setPsSpeakerScreenActive}
              onToggleFullScreen={handleToggleFullScreen}
              onNextChallengeTrigger={() => triggerTransition('NEXT_C_PS')}
              onBackToSelection={() => setCurrentScreen('GAME_SELECTION')}
            />
          </motion.div>
        )}

        {/* SCREEN 6: STAGE MYSTERY TRANSITION */}
        {currentScreen === 'TRANSITION' && (
          <motion.div
            key="transition-stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <TransitionScreen onComplete={handleTransitionComplete} />
          </motion.div>
        )}

        {/* SCREEN 7: EVENT STAGE COMPLETED SCREEN */}
        {currentScreen === 'COMPLETED' && (
          <motion.div
            key="game-completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 80 }}
            className="w-full min-h-screen flex flex-col justify-center items-center bg-[#04020a] text-center p-6 md:p-12 relative overflow-hidden"
          >
            {/* Ambient neon backdrop */}
            <div className="absolute w-[500px] h-[500px] rounded-full bg-yellow-500/10 blur-[150px] animate-pulse pointer-events-none" />
            
            {/* Animated background stars */}
            <div className="absolute inset-0 pointer-events-none opacity-45">
              {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-yellow-300"
                  style={{
                    left: `${Math.random() * 90 + 5}%`,
                    top: `${Math.random() * 80 + 10}%`,
                  }}
                  animate={{
                    scale: [1, 1.4, 0.8, 1.2, 1],
                    opacity: [0.4, 1, 0.4]
                  }}
                  transition={{
                    duration: Math.random() * 2 + 1.5,
                    repeat: Infinity,
                  }}
                >
                  <Star className="w-5 h-5 fill-current" />
                </motion.div>
              ))}
            </div>

            <div className="max-w-2xl bg-slate-950/80 border border-yellow-500/30 p-12 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center relative z-10 backdrop-blur-md">
              <CollegeLogo size={140} animate={false} className="mb-6" />

              {/* Huge Golden Cup */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="relative mb-6"
              >
                <Trophy className="w-32 h-32 text-yellow-400 drop-shadow-[0_0_25px_rgba(234,179,8,0.5)] fill-current" />
                <Sparkles className="absolute top-2 right-2 w-8 h-8 text-yellow-200 animate-spin" />
              </motion.div>

              <h1 className="text-4xl md:text-5xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-200 to-yellow-500">
                ROUND COMPLETE!
              </h1>
              
              <p className="text-base text-gray-300 font-mono max-w-md mt-4 leading-relaxed">
                Congratulations to all participating departments! You survived the ultimate tech, meme, and stage-acting challenges of KIT Coimbatore!
              </p>

              <div className="flex gap-4 w-full mt-10">
                <button
                  onClick={handleRestartCompletedGame}
                  className="flex-1 py-4 bg-slate-900 border border-white/10 text-white rounded-xl font-bold font-mono text-sm tracking-widest hover:bg-slate-800 hover:border-white/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  RESTART STAGE
                </button>
                
                <button
                  onClick={() => { sound.playClick(); setCurrentScreen('GAME_SELECTION'); }}
                  className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-amber-500 text-slate-950 font-black rounded-xl text-sm tracking-widest hover:from-yellow-400 hover:to-amber-400 transition-all cursor-pointer shadow-lg"
                >
                  GAME MENU
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ----------------------------------------------------
          ADMIN MODAL DIALOGUE WINDOW
      ---------------------------------------------------- */}
      {isAdminOpen && (
        <AdminPanel 
          questions1={questions1}
          questions2={questions2}
          actors={actors}
          spinningTime={spinningTime}
          speakingTime={speakingTime}
          onUpdateQuestions1={handleUpdateQuestions1}
          onUpdateQuestions2={handleUpdateQuestions2}
          onUpdateActors={handleUpdateActors}
          onUpdateSpinningTime={handleUpdateSpinningTime}
          onUpdateSpeakingTime={handleUpdateSpeakingTime}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
}

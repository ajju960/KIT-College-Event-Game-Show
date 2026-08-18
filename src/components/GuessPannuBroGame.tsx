/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import CtrlGuessGame from './CtrlGuessGame';
import { Question } from '../types';

interface GuessPannuBroGameProps {
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
}

export default function GuessPannuBroGame(props: GuessPannuBroGameProps) {
  const [emojis, setEmojis] = useState<{ id: number; x: number; char: string; size: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    // Generate playful, funny emojis floating in the background for a lighthearted atmosphere
    const emojiPool = ['😂', '🤪', '🤫', '🔥', '👀', '💯', '😎', '🎓'];
    const list = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 90 + 5,
      char: emojiPool[i % emojiPool.length],
      size: Math.random() * 20 + 20,
      delay: Math.random() * 5,
      duration: Math.random() * 8 + 8,
    }));
    setEmojis(list);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#080502]">
      {/* Playful Floating Emojis Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {emojis.map((e) => (
          <motion.div
            key={e.id}
            className="absolute opacity-10 select-none text-2xl"
            style={{
              left: `${e.x}%`,
              bottom: `-50px`,
              fontSize: `${e.size}px`,
            }}
            animate={{
              y: ['0px', '-110vh'],
              x: ['0px', `${Math.sin(e.id) * 50}px`],
              rotate: [0, 360 * (e.id % 2 === 0 ? 1 : -1)],
            }}
            transition={{
              duration: e.duration,
              delay: e.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {e.char}
          </motion.div>
        ))}
      </div>

      {/* Render the core game layout with playful themes */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        <CtrlGuessGame 
          {...props}
          gameTitle="GUESS PANNU BRO?"
          subtitle="3 CLUES, 1 FUNNY CAMPUS ANSWER – THINK OUT OF THE BOX!"
          playfulStyle={true}
        />
      </div>
    </div>
  );
}

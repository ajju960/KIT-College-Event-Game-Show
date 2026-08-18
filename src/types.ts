/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameType = 'CTRL_GUESS' | 'GUESS_PANNU_BRO' | 'PICK_SPEAK';

export interface Question {
  id: string;
  images: string[]; // 3 image URLs
  answer: string; // Correct word/concept to guess
  clue: string; // Textual hint / sentence
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  round: number;
  hiddenLetters: number[]; // Indices of letters in the answer that are hidden (0-indexed)
}

export interface Actor {
  id: string;
  name: string;
  image: string; // URL of actor image
  enabled: boolean;
}

export interface GameSettings {
  spinningTime: number; // in seconds (e.g. 5)
  speakingTime: number; // in seconds (e.g. 60)
  theme: 'futuristic' | 'playful';
}

export interface AppState {
  currentScreen: 'WELCOME' | 'GAME_SELECTION' | 'PLAYING' | 'TRANSITION' | 'COMPLETED';
  activeGame: GameType | null;
  ctrlGuessState: {
    currentQuestionIndex: number;
    revealedImagesCount: number; // 1, 2, or 3
    isClueRevealed: boolean;
    isAnswerRevealed: boolean;
    timerSeconds: number;
    isTimerRunning: boolean;
    questions: Question[];
  };
  guessPannuBroState: {
    currentQuestionIndex: number;
    revealedImagesCount: number;
    isClueRevealed: boolean;
    isAnswerRevealed: boolean;
    timerSeconds: number;
    isTimerRunning: boolean;
    questions: Question[];
  };
  pickSpeakState: {
    actors: Actor[];
    spinningTime: number;
    speakingTime: number;
    selectedActorId: string | null;
    wheelRotation: number;
    isSpinning: boolean;
    speakingSecondsLeft: number;
    isSpeakingTimerRunning: boolean;
    speakingTimerPaused: boolean;
    speakerScreenActive: boolean; // active speaking mode screen
  };
}

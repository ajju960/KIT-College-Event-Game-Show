/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Question } from '../types';

export const defaultCtrlGuessQuestions: Question[] = [
  {
    id: 'cg-1',
    images: [
      'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=600&q=80', // DNA
      'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=600&q=80', // Plant sprout
      'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=600&q=80', // Lab
    ],
    answer: 'BIOTECHNOLOGY',
    clue: 'Using living systems and organisms to develop or make products!',
    difficulty: 'EASY',
    round: 1,
    hiddenLetters: [1, 3, 5, 7, 9, 11],
  },
  {
    id: 'cg-2',
    images: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80', // Server connections
      'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&w=600&q=80', // Bitcoin coin
      'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&w=600&q=80', // Secure padlock
    ],
    answer: 'BLOCKCHAIN',
    clue: 'A decentralized, distributed ledger that records the provenance of a digital asset.',
    difficulty: 'MEDIUM',
    round: 1,
    hiddenLetters: [1, 3, 5, 7, 9],
  },
  {
    id: 'cg-3',
    images: [
      'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?auto=format&fit=crop&w=600&q=80', // Blue sky clouds
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80', // Server racks
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', // Global network
    ],
    answer: 'CLOUD COMPUTING',
    clue: 'On-demand delivery of computing services over the internet with pay-as-you-go pricing.',
    difficulty: 'EASY',
    round: 2,
    hiddenLetters: [1, 3, 5, 8, 10, 12],
  },
  {
    id: 'cg-4',
    images: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80', // Shield defender
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', // Cyber code
      'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&w=600&q=80', // Lock
    ],
    answer: 'CYBER SECURITY',
    clue: 'The practice of defending computers, servers, mobile devices, electronic systems, and networks from malicious attacks.',
    difficulty: 'HARD',
    round: 2,
    hiddenLetters: [1, 3, 6, 8, 10],
  },
];

export const defaultGuessPannuBroQuestions: Question[] = [
  {
    id: 'gp-1',
    images: [
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80', // Studying late
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80', // Strong coffee
      'https://images.unsplash.com/photo-1505159947354-e09e5ec413da?auto=format&fit=crop&w=600&q=80', // Sinking ship / crisis
    ],
    answer: 'SEMESTER EXAMS',
    clue: 'The ultimate survival battle where engineering students study 100 chapters in 1 night!',
    difficulty: 'EASY',
    round: 1,
    hiddenLetters: [1, 3, 5, 9, 11],
  },
  {
    id: 'gp-2',
    images: [
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80', // Bowl of soup
      'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80', // Vada
      'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=600&q=80', // Long queue of students
    ],
    answer: 'CANTEEN SAMBAR',
    clue: 'Watery, golden, and infinitely refilled. We complain about it, yet we are back in line every morning!',
    difficulty: 'MEDIUM',
    round: 1,
    hiddenLetters: [1, 3, 5, 8, 10, 12],
  },
  {
    id: 'gp-3',
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80', // Writing notebook
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80', // Sprinting runner
      'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8?auto=format&fit=crop&w=600&q=80', // Danger siren red
    ],
    answer: 'LAST MINUTE RECORD',
    clue: 'Copied from the class topper at 4 AM, completed with absolute speed-writing on the day of lab exams.',
    difficulty: 'HARD',
    round: 2,
    hiddenLetters: [2, 4, 7, 9, 12, 14],
  },
  {
    id: 'gp-4',
    images: [
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80', // Angry pointing teacher
      'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=600&q=80', // Water drops / tiny drips
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80', // Sad puppy begging eyes
    ],
    answer: 'INTERNAL MARKS',
    clue: 'A magical currency controlled by professors. It keeps the rowdiest students on their absolute best behavior.',
    difficulty: 'MEDIUM',
    round: 2,
    hiddenLetters: [1, 4, 7, 10, 12],
  },
];

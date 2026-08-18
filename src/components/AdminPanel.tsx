/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Question, Actor, GameType } from '../types';
import { sound } from '../utils/sound';
import { 
  X, Plus, Trash2, Edit2, Copy, ArrowUp, ArrowDown, Upload, Eye, Check, RefreshCw, AlertCircle, Database, Settings, ShieldCheck,
  Lock, LogOut, Mail, User as UserIcon, Loader2
} from 'lucide-react';
import { 
  getSavedFirebaseConfig, saveFirebaseConfig, isFirebaseConnected, FirebaseConfig, initFirebase, saveGameDataToCloud,
  uploadAndAssociateActorImage, uploadAndAssociateQuestionImage, uploadFileToStorage,
  getFirebaseAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User
} from '../utils/firebase';
import { compressImage } from '../utils/imageCompressor';
import { getSavedCloudinaryConfig, saveCloudinaryConfig, isCloudinaryConfigured, uploadFileToCloudinary } from '../utils/cloudinary';

interface AdminPanelProps {
  questions1: Question[];
  questions2: Question[];
  actors: Actor[];
  spinningTime: number;
  speakingTime: number;
  onUpdateQuestions1: (qs: Question[]) => void;
  onUpdateQuestions2: (qs: Question[]) => void;
  onUpdateActors: (as: Actor[]) => void;
  onUpdateSpinningTime: (t: number) => void;
  onUpdateSpeakingTime: (t: number) => void;
  onClose: () => void;
}

export default function AdminPanel({
  questions1,
  questions2,
  actors,
  spinningTime,
  speakingTime,
  onUpdateQuestions1,
  onUpdateQuestions2,
  onUpdateActors,
  onUpdateSpinningTime,
  onUpdateSpeakingTime,
  onClose,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'CTRL_GUESS' | 'GUESS_PANNU_BRO' | 'PICK_SPEAK' | 'SETTINGS'>('CTRL_GUESS');
  
  // Firebase configuration form states
  const [fbConfig, setFbConfig] = useState<FirebaseConfig>(() => {
    const saved = getSavedFirebaseConfig();
    return saved || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    };
  });
  const [fbStatus, setFbStatus] = useState<'IDLE' | 'SAVING' | 'CONNECTED' | 'ERROR'>(
    isFirebaseConnected() ? 'CONNECTED' : 'IDLE'
  );

  // Cloudinary configuration states
  const [clConfig, setClConfig] = useState<{ cloudName: string; uploadPreset: string; }>(() => {
    const saved = getSavedCloudinaryConfig();
    return saved || { cloudName: '', uploadPreset: '' };
  });
  const [clStatus, setClStatus] = useState<'IDLE' | 'CONNECTED'>(
    isCloudinaryConfigured() ? 'CONNECTED' : 'IDLE'
  );
  
  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Question Form State (Edit/Create Modal)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [targetList, setTargetList] = useState<'q1' | 'q2'>('q1');
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [formImages, setFormImages] = useState<string[]>(['', '', '']);
  const [formAnswer, setFormAnswer] = useState('');
  const [formClue, setFormClue] = useState('');
  const [formDifficulty, setFormDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [formRound, setFormRound] = useState(1);
  const [formHiddenLetters, setFormHiddenLetters] = useState<number[]>([]);

  // Actor Form State
  const [editActorId, setEditActorId] = useState<string | null>(null);
  const [actorName, setActorName] = useState('');
  const [actorImage, setActorImage] = useState('');

  // Image Uploading States for visual feedback
  const [actorUploadingId, setActorUploadingId] = useState<string | null>(null);
  const [questionUploadingIndexes, setQuestionUploadingIndexes] = useState<boolean[]>([false, false, false]);

  // ----------------------------------------------------
  // FIREBASE AUTHENTICATION STATE
  // ----------------------------------------------------
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (auth) {
      setCurrentUser(auth.currentUser);
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsubscribe();
    }
  }, [fbStatus]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    sound.playClick();

    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthError('Firebase Auth is not initialized. Connect Firebase under settings first.');
      setAuthLoading(false);
      return;
    }

    try {
      if (authMode === 'LOGIN') {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        sound.playSuccess();
      } else {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        sound.playSuccess();
      }
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error("Auth action failed:", err);
      let msg = err.message || 'Authentication failed.';
      if (err?.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err?.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered as an admin.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err?.code === 'auth/configuration-not-found' || err?.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Email/Password Authentication is not enabled! To fix this:\n1. Open your Firebase Console (https://console.firebase.google.com)\n2. Navigate to Build > Authentication > Sign-in method\n3. Click "Add new provider" (or Edit), select "Email/Password", enable it, and click Save.';
      }
      setAuthError(msg);
      sound.playBuzzer();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    sound.playClick();
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await signOut(auth);
        setCurrentUser(null);
      } catch (err) {
        console.error("Logout failed:", err);
      }
    }
  };

  // ----------------------------------------------------
  // NATIVE DRAG & DROP
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number, listType: 'q1' | 'q2') => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const currentList = listType === 'q1' ? [...questions1] : [...questions2];
    const updateFn = listType === 'q1' ? onUpdateQuestions1 : onUpdateQuestions2;

    const draggedItem = currentList[draggedIndex];
    const remainingItems = currentList.filter((_, idx) => idx !== draggedIndex);
    
    // Insert dragged item at target index
    const newList = [
      ...remainingItems.slice(0, targetIndex),
      draggedItem,
      ...remainingItems.slice(targetIndex)
    ];

    updateFn(newList);
    setDraggedIndex(null);
    sound.playClick();
  };

  // ----------------------------------------------------
  // QUESTION MANAGEMENT
  // ----------------------------------------------------
  const openAddQuestionModal = (list: 'q1' | 'q2') => {
    setTargetList(list);
    setEditQuestionId(null);
    setFormImages(['', '', '']);
    setFormAnswer('');
    setFormClue('');
    setFormDifficulty('EASY');
    setFormRound(1);
    setFormHiddenLetters([]);
    setIsQuestionModalOpen(true);
    sound.playClick();
  };

  const openEditQuestionModal = (list: 'q1' | 'q2', q: Question) => {
    setTargetList(list);
    setEditQuestionId(q.id);
    setFormImages([...q.images]);
    setFormAnswer(q.answer);
    setFormClue(q.clue);
    setFormDifficulty(q.difficulty);
    setFormRound(q.round);
    setFormHiddenLetters([...q.hiddenLetters]);
    setIsQuestionModalOpen(true);
    sound.playClick();
  };

  const handleSaveQuestion = () => {
    if (!formAnswer.trim()) return;
    const currentList = targetList === 'q1' ? [...questions1] : [...questions2];
    const updateFn = targetList === 'q1' ? onUpdateQuestions1 : onUpdateQuestions2;

    if (editQuestionId) {
      // Edit existing
      const updatedList = currentList.map((q) => {
        if (q.id === editQuestionId) {
          return {
            ...q,
            images: formImages.map(img => img.trim() || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=400&q=80'),
            answer: formAnswer.toUpperCase().trim(),
            clue: formClue.trim() || 'No clue provided',
            difficulty: formDifficulty,
            round: formRound,
            hiddenLetters: formHiddenLetters,
          };
        }
        return q;
      });
      updateFn(updatedList);
    } else {
      // Create new
      const newQuestion: Question = {
        id: `custom-q-${Date.now()}`,
        images: formImages.map(img => img.trim() || 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=400&q=80'),
        answer: formAnswer.toUpperCase().trim(),
        clue: formClue.trim() || 'No clue provided',
        difficulty: formDifficulty,
        round: formRound,
        hiddenLetters: formHiddenLetters,
      };
      updateFn([...currentList, newQuestion]);
    }

    setIsQuestionModalOpen(false);
    sound.playSuccess();
  };

  const handleDeleteQuestion = (list: 'q1' | 'q2', qId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    const currentList = list === 'q1' ? [...questions1] : [...questions2];
    const updateFn = list === 'q1' ? onUpdateQuestions1 : onUpdateQuestions2;
    updateFn(currentList.filter(q => q.id !== qId));
    sound.playBuzzer();
  };

  const handleDuplicateQuestion = (list: 'q1' | 'q2', q: Question) => {
    const currentList = list === 'q1' ? [...questions1] : [...questions2];
    const updateFn = list === 'q1' ? onUpdateQuestions1 : onUpdateQuestions2;
    const duplicated: Question = {
      ...q,
      id: `custom-q-${Date.now()}`,
      answer: `${q.answer} COPY`,
    };
    updateFn([...currentList, duplicated]);
    sound.playSuccess();
  };

  const toggleHiddenLetterInForm = (index: number) => {
    if (formHiddenLetters.includes(index)) {
      setFormHiddenLetters(formHiddenLetters.filter(i => i !== index));
    } else {
      setFormHiddenLetters([...formHiddenLetters, index].sort((a, b) => a - b));
    }
    sound.playClick();
  };

  const autoHideAlternativeLetters = () => {
    const letterIndices = Array.from({ length: formAnswer.length })
      .map((_, i) => i)
      .filter(i => formAnswer[i] !== ' ');
    // Hide every alternate index
    const hidden = letterIndices.filter(i => i % 2 !== 0);
    setFormHiddenLetters(hidden);
    sound.playClick();
  };

  // ----------------------------------------------------
  // ACTOR MANAGEMENT
  // ----------------------------------------------------
  const handleEditActor = (actor: Actor) => {
    setEditActorId(actor.id);
    setActorName(actor.name);
    setActorImage(actor.image);
    sound.playClick();
  };

  const handleSaveActor = (id: string) => {
    const updatedActors = actors.map((act) => {
      if (act.id === id) {
        return {
          ...act,
          name: actorName.trim() || 'Actor Slot',
          image: actorImage.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        };
      }
      return act;
    });
    onUpdateActors(updatedActors);
    setEditActorId(null);
    sound.playSuccess();
  };

  const handleToggleActor = (id: string) => {
    const updated = actors.map((act) => {
      if (act.id === id) {
        return { ...act, enabled: !act.enabled };
      }
      return act;
    });
    onUpdateActors(updated);
    sound.playClick();
  };

  const handleActorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, actorId: string) => {
    const rawFile = e.target.files?.[0];
    if (rawFile) {
      setActorUploadingId(actorId);
      try {
        const { file: compressedFile, base64: compressedBase64 } = await compressImage(rawFile);
        
        let url: string | null = null;

        // 1. If Firebase is connected, use unified cloud upload which handles Cloudinary automatically if active
        if (isFirebaseConnected()) {
          try {
            url = await uploadAndAssociateActorImage(actorId, compressedFile);
          } catch (err) {
            console.error("Firebase cloud upload process failed:", err);
          }
        }

        // 2. If Firebase is not connected, but Cloudinary is configured, upload directly to Cloudinary
        if (!url && isCloudinaryConfigured()) {
          try {
            url = await uploadFileToCloudinary(compressedFile);
          } catch (err) {
            console.error("Direct Cloudinary upload failed:", err);
          }
        }

        // 3. Determine the final image string (either uploaded cloud URL or base64 fallback)
        const finalUrl = url || compressedBase64;

        if (editActorId === actorId) {
          setActorImage(finalUrl);
        } else {
          const updated = actors.map((act) => {
            if (act.id === actorId) {
              return { ...act, image: finalUrl };
            }
            return act;
          });
          onUpdateActors(updated);
        }
        sound.playSuccess();
      } catch (err) {
        console.error("Failed to compress or upload actor image:", err);
      } finally {
        setActorUploadingId(null);
      }
    }
  };

  const handleRemoveActor = (id: string) => {
    const updated = actors.map((act) => {
      if (act.id === id) {
        return { ...act, name: 'Empty Slot', image: '', enabled: false };
      }
      return act;
    });
    onUpdateActors(updated);
    sound.playBuzzer();
  };

  const handleResetAllActors = () => {
    if (!window.confirm('Reset all actors to default star slots?')) return;
    const defaults = [
      { id: 'act-1', name: 'Thalapathy Vijay', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', enabled: true },
      { id: 'act-2', name: 'Superstar Rajinikanth', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', enabled: true },
      { id: 'act-3', name: 'Thala Ajith Kumar', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80', enabled: true },
      { id: 'act-4', name: 'Ulaganayagan Kamal Haasan', image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=80', enabled: true },
      { id: 'act-5', name: 'Nadippin Nayagan Suriya', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80', enabled: true },
      { id: 'act-6', name: 'Sivakarthikeyan', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80', enabled: true },
    ];
    onUpdateActors(defaults);
    sound.playSuccess();
  };

  const renderQuestionList = (listType: 'q1' | 'q2') => {
    const questions = listType === 'q1' ? questions1 : questions2;
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest">
            PRESENTED QUESTIONS ({questions.length})
          </h3>
          <button
            onClick={() => openAddQuestionModal(listType)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> ADD QUESTION
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-white/10 text-gray-500 font-mono text-sm">
            <AlertCircle className="w-8 h-8 text-cyan-400/40 mx-auto mb-2" />
            NO QUESTIONS CONFIGURED. ADD SOME TO GET STARTED!
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] text-gray-500 font-mono italic">
              * Drag and drop the handles below to reorder questions instantly.
            </p>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx, listType)}
                className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-950/70 border border-white/5 hover:border-cyan-500/20 rounded-xl transition-all cursor-move"
              >
                {/* Drag Handle and Basics */}
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <div className="flex flex-col items-center justify-center text-slate-500 hover:text-white px-1">
                    <ArrowUp className="w-3.5 h-3.5 -mb-1" />
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                  
                  {/* Miniature Image Preview Cluster */}
                  <div className="flex -space-x-2 mr-1">
                    {q.images.map((img, imgIdx) => (
                      <img 
                        key={imgIdx} 
                        src={img} 
                        alt="Clue thumbnail" 
                        className="w-8 h-8 rounded-md object-cover border border-slate-950 bg-slate-900"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=40&q=80';
                        }}
                      />
                    ))}
                  </div>

                  <div className="min-w-0 flex-grow">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-wider bg-slate-800 px-2 py-0.5 rounded text-gray-400">
                        ROUND {q.round}
                      </span>
                      <span className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        q.difficulty === 'EASY' ? 'bg-emerald-950 text-emerald-400' :
                        q.difficulty === 'MEDIUM' ? 'bg-amber-950 text-amber-400' :
                        'bg-rose-950 text-rose-400'
                      }`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <h4 className="text-base font-black tracking-widest text-white mt-1 truncate">
                      {q.answer}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono truncate max-w-md">
                      Clue: {q.clue}
                    </p>
                  </div>
                </div>

                {/* Question operations */}
                <div className="flex items-center gap-2 mt-3 md:mt-0 ml-auto pl-4">
                  <button
                    onClick={() => openEditQuestionModal(listType, q)}
                    className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Edit Question"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateQuestion(listType, q)}
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Duplicate Question"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(listType, q.id)}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const showLogin = isFirebaseConnected() && !currentUser && activeTab !== 'SETTINGS';

  return (
    <div id="admin-dashboard-panel" className="fixed inset-0 z-50 bg-[#02040a]/95 flex justify-center items-center p-4 overflow-y-auto">
      {/* Container Card */}
      <div className="bg-slate-950 border border-cyan-500/30 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden">
        
        {/* Admin Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-slate-900/40">
          <div>
            <h2 className="text-xl font-black tracking-widest text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              ORGANIZER CONTROL PANEL
            </h2>
            <p className="text-xs font-mono text-gray-400 mt-1">
              CONFIGURE PRESENTATION SCREENS AND MANAGE GAME CONTENT FOR THE PROJECTOR SCREEN
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isFirebaseConnected() && currentUser && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 rounded-xl text-xs font-bold font-mono tracking-wider cursor-pointer transition-all"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SIGN OUT</span>
              </button>
            )}
            <button
              onClick={() => { sound.playClick(); onClose(); }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Buttons bar */}
        <div className="flex border-b border-white/5 bg-slate-950">
          {(['CTRL_GUESS', 'GUESS_PANNU_BRO', 'PICK_SPEAK', 'SETTINGS'] as const).map((tab) => {
            const isDisabled = isFirebaseConnected() && !currentUser && tab !== 'SETTINGS';
            return (
              <button
                key={tab}
                disabled={isDisabled}
                onClick={() => { sound.playClick(); setActiveTab(tab); }}
                className={`flex-1 py-4 text-center text-xs font-mono font-bold tracking-widest border-b-2 transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-950/10' 
                    : isDisabled
                      ? 'border-transparent text-gray-700 cursor-not-allowed opacity-30'
                      : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        {/* Tab Content Box */}
        <div className="flex-grow p-6 overflow-y-auto bg-[#040810]">
          
          {showLogin ? (
            <div className="flex-grow flex flex-col justify-center items-center py-8">
              <div className="w-full max-w-md bg-slate-950/80 border border-cyan-500/20 p-8 rounded-2xl shadow-[0_0_40px_rgba(6,182,212,0.15)] backdrop-blur-md">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 mb-4">
                    <ShieldCheck className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-lg font-black tracking-widest text-white uppercase">
                    ORGANIZER VERIFICATION
                  </h3>
                  <p className="text-xs font-mono text-gray-400 mt-2 leading-relaxed">
                    Firebase Authentication is active. If you don't have an admin account yet, please click the <strong className="text-cyan-400">REGISTER ADMIN</strong> tab below to create one instantly!
                  </p>
                </div>

                {/* Dual Login / SignUp Selector Tabs */}
                <div className="flex border-b border-white/5 mb-6">
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setAuthMode('LOGIN'); setAuthError(''); }}
                    className={`flex-1 pb-3 text-center text-xs font-mono font-bold tracking-widest border-b-2 transition-all cursor-pointer ${
                      authMode === 'LOGIN' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setAuthMode('SIGNUP'); setAuthError(''); }}
                    className={`flex-1 pb-3 text-center text-xs font-mono font-bold tracking-widest border-b-2 transition-all cursor-pointer ${
                      authMode === 'SIGNUP' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-gray-500 hover:text-gray-400'
                    }`}
                  >
                    REGISTER ADMIN
                  </button>
                </div>

                {authError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-xs font-mono text-red-400 mb-4 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="whitespace-pre-line">{authError}</span>
                  </div>
                )}

                <form onSubmit={handleAuthAction} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Admin Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="admin@college.edu"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono tracking-wider text-gray-400 uppercase">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl font-bold font-mono text-[10px] tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-lg disabled:opacity-55 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : authMode === 'LOGIN' ? (
                      'SIGN IN AS ADMIN'
                    ) : (
                      'REGISTER NEW ADMIN'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                  <button
                    type="button"
                    onClick={() => { sound.playClick(); setActiveTab('SETTINGS'); setAuthError(''); }}
                    className="text-[10px] font-mono tracking-wider text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Configure custom Firebase connection credentials?
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Back to Login header if not logged in but configuring Settings */}
              {isFirebaseConnected() && !currentUser && activeTab === 'SETTINGS' && (
                <div className="mb-6 p-4 bg-cyan-950/10 border border-cyan-500/20 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Database className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold tracking-wider">CONFIGURING FIREBASE CONNECTION CREDENTIALS</span>
                  </div>
                  <button
                    onClick={() => { sound.playClick(); setActiveTab('CTRL_GUESS'); }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-gray-300 hover:text-white rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors"
                  >
                    ← BACK TO VERIFICATION
                  </button>
                </div>
              )}

              {/* CTRL_GUESS (TECHNICAL GAME) TAB */}
              {activeTab === 'CTRL_GUESS' && renderQuestionList('q1')}

              {/* GUESS_PANNU_BRO (FUN CAMPUS GAME) TAB */}
              {activeTab === 'GUESS_PANNU_BRO' && renderQuestionList('q2')}

          {/* PICK_SPEAK TAB */}
          {activeTab === 'PICK_SPEAK' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest">
                    6 SPINNING WHEEL SLOT MANAGEMENT
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    Configure 6 slots to display portrait images and star name captions.
                  </p>
                </div>
                <button
                  onClick={handleResetAllActors}
                  className="flex items-center gap-1 px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-bold font-mono tracking-wider cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> RESET DEFAULTS
                </button>
              </div>

              {/* Grid of Slots */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {actors.map((act, index) => {
                  const isEditing = editActorId === act.id;
                  return (
                    <div 
                      key={act.id}
                      className={`relative p-5 rounded-2xl bg-slate-950 border transition-all ${
                        act.enabled 
                          ? 'border-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]' 
                          : 'border-white/5 opacity-70'
                      }`}
                    >
                      {/* Top Action Ribbon */}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-mono tracking-widest text-pink-400 font-bold">
                          SLOT {index + 1}
                        </span>
                        
                        {/* Enabled check checkbox */}
                        <label className="flex items-center gap-1.5 text-xs font-mono cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={act.enabled}
                            onChange={() => handleToggleActor(act.id)}
                            className="rounded accent-pink-500 border-white/20"
                          />
                          <span className={act.enabled ? 'text-pink-400' : 'text-gray-500'}>
                            {act.enabled ? 'ACTIVE' : 'DISABLED'}
                          </span>
                        </label>
                      </div>

                      {/* Display / Form */}
                      <div className="flex gap-4 items-center">
                        {/* Image Preview / Circle Upload */}
                        <div className="relative w-20 h-20 rounded-full border border-pink-500/20 overflow-hidden bg-slate-900 flex-shrink-0 flex items-center justify-center group/img">
                          {actorUploadingId === act.id ? (
                            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-[9px] text-cyan-400 font-mono font-bold">
                              <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mb-1" />
                              UPLOADING
                            </div>
                          ) : (
                            <>
                              {(isEditing ? actorImage : act.image) ? (
                                <img src={isEditing ? actorImage : act.image} alt={act.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">👤</span>
                              )}
                              
                              {/* File input cover */}
                              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center cursor-pointer text-[10px] text-pink-300 font-mono transition-opacity">
                                <Upload className="w-4 h-4 mb-1" />
                                UPLOAD
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  disabled={actorUploadingId !== null}
                                  onChange={(e) => handleActorImageUpload(e, act.id)}
                                  className="hidden" 
                                />
                              </label>
                            </>
                          )}
                        </div>

                        {/* Inline Fields */}
                        <div className="flex-grow min-w-0">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input 
                                type="text"
                                value={actorName}
                                onChange={(e) => setActorName(e.target.value)}
                                className="w-full bg-slate-900 border border-pink-500/40 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                                placeholder="Actor Name..."
                              />
                              <div className="space-y-1.5">
                                <label className={`block w-full py-1.5 px-2 border text-center text-[10px] font-bold font-mono tracking-wider cursor-pointer transition-all ${
                                  actorUploadingId === act.id
                                    ? 'bg-slate-950 border-white/5 text-gray-500 cursor-not-allowed'
                                    : 'bg-slate-900 hover:bg-slate-850 border-pink-500/20 hover:border-pink-500/45 text-pink-400 hover:text-white'
                                }`}>
                                  {actorUploadingId === act.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 inline-block mr-1 -mt-0.5 animate-spin text-cyan-400" /> UPLOADING...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-3 h-3 inline-block mr-1 -mt-0.5" /> {actorImage ? 'REPLACE IMAGE' : 'UPLOAD IMAGE FILE'}
                                    </>
                                  )}
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    disabled={actorUploadingId !== null}
                                    onChange={(e) => handleActorImageUpload(e, act.id)}
                                    className="hidden" 
                                  />
                                </label>
                                {actorImage && !actorUploadingId && (
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded border border-pink-500/30 overflow-hidden bg-slate-900 flex-shrink-0">
                                      <img src={actorImage} alt="Thumb" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-[9px] text-emerald-400 font-mono font-bold">IMAGE SECURED ✓</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 pt-1">
                                <button 
                                  onClick={() => handleSaveActor(act.id)}
                                  className="flex-1 py-1 bg-pink-600 hover:bg-pink-500 rounded text-[10px] font-bold font-mono tracking-wider cursor-pointer"
                                >
                                  SAVE
                                </button>
                                <button 
                                  onClick={() => { setEditActorId(null); sound.playClick(); }}
                                  className="px-2 py-1 bg-slate-800 rounded text-[10px] font-bold font-mono text-gray-400 cursor-pointer"
                                >
                                  CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-bold text-white truncate mb-1">
                                {act.image ? act.name : 'Empty Slot'}
                              </h4>
                              <p className="text-[10px] text-gray-500 font-mono truncate">
                                {act.image ? 'Custom image loaded' : 'Click EDIT to configure'}
                              </p>
                              
                              <div className="flex gap-2 mt-2">
                                <button
                                  onClick={() => handleEditActor(act)}
                                  className="text-[10px] font-mono font-bold text-pink-400 hover:text-white flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" /> EDIT
                                </button>
                                {act.image && (
                                  <button
                                    onClick={() => handleRemoveActor(act.id)}
                                    className="text-[10px] font-mono font-bold text-rose-500 hover:text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" /> REMOVE
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GENERAL SETTINGS TAB */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-4">
                  GAME DURATION & SPEEDS
                </h3>
                
                {/* Spinning duration setting */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-white/5 space-y-3 mb-6">
                  <label className="block text-sm font-bold text-white font-mono">
                    WHEEL SPINNING DURATION
                  </label>
                  <p className="text-xs text-gray-400 font-mono">
                    Control how long (in seconds) the actor wheel spins dramatically before decelerating to a stop.
                  </p>
                  
                  {/* Select options */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[3, 5, 8, 10].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => { sound.playClick(); onUpdateSpinningTime(sec); }}
                        className={`px-4 py-2 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                          spinningTime === sec 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' 
                            : 'border-white/10 hover:border-white/25 text-gray-400'
                        }`}
                      >
                        {sec} SECONDS
                      </button>
                    ))}
                    
                    {/* Custom input option */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        max="30"
                        value={spinningTime}
                        onChange={(e) => onUpdateSpinningTime(Number(e.target.value) || 5)}
                        className="w-16 bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-xs text-white font-mono text-center"
                      />
                      <span className="text-xs font-mono text-gray-500">CUSTOM SEC</span>
                    </div>
                  </div>
                </div>

                {/* Speaking round duration setting */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-white/5 space-y-3">
                  <label className="block text-sm font-bold text-white font-mono">
                    PICK & SPEAK COUNTDOWN TIMER
                  </label>
                  <p className="text-xs text-gray-400 font-mono">
                    The active countdown timer allocated for the speaking stage (after wheel selection).
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    {[30, 60, 90, 120].map((sec) => (
                      <button
                        key={sec}
                        onClick={() => { sound.playClick(); onUpdateSpeakingTime(sec); }}
                        className={`px-4 py-2 text-xs font-mono font-bold border rounded-lg transition-all cursor-pointer ${
                          speakingTime === sec 
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400' 
                            : 'border-white/10 hover:border-white/25 text-gray-400'
                        }`}
                      >
                        {sec >= 60 ? `${sec / 60} MINUTE` : `${sec} SECONDS`}
                      </button>
                    ))}
                    
                    {/* Custom input option */}
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="5" 
                        max="600"
                        value={speakingTime}
                        onChange={(e) => onUpdateSpeakingTime(Number(e.target.value) || 60)}
                        className="w-20 bg-slate-900 border border-white/10 rounded-lg py-2 px-3 text-xs text-white font-mono text-center"
                      />
                      <span className="text-xs font-mono text-gray-500">CUSTOM SEC</span>
                    </div>
                  </div>
                </div>
                
                {/* Firebase Cloud Synchronization Section */}
                <div className="p-5 mt-6 rounded-2xl bg-slate-950 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      FIREBASE CLOUD SYNCHRONIZATION
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        fbStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' :
                        fbStatus === 'SAVING' ? 'bg-amber-400 animate-spin' :
                        fbStatus === 'ERROR' ? 'bg-rose-500' : 'bg-gray-600'
                      }`} />
                      <span className={`text-[10px] font-mono font-bold tracking-widest ${
                        fbStatus === 'CONNECTED' ? 'text-emerald-400' :
                        fbStatus === 'SAVING' ? 'text-amber-400' :
                        fbStatus === 'ERROR' ? 'text-rose-400' : 'text-gray-500'
                      }`}>
                        {fbStatus === 'CONNECTED' ? 'CLOUD ACTIVE ✓' :
                         fbStatus === 'SAVING' ? 'CONNECTING...' :
                         fbStatus === 'ERROR' ? 'CONFIG ERROR' : 'LOCAL OFFLINE'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    By default, the organizer dashboard runs on a local browser cache. Connect your Firebase Web App credentials to sync questions, actors, and presentation settings to Google Firestore Cloud instantly.
                  </p>

                  {fbStatus === 'CONNECTED' ? (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-300 font-mono">FIRESTORE CLOUD SYNC IS ONLINE</h4>
                          <p className="text-[10px] text-emerald-500 font-mono mt-0.5">
                            Real-time synchronization is running. Any question updates, actor slots, or countdown timers configured in this Control Panel are automatically synchronized to your database.
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            saveFirebaseConfig(null);
                            setFbConfig({
                              apiKey: '',
                              authDomain: '',
                              projectId: '',
                              storageBucket: '',
                              messagingSenderId: '',
                              appId: '',
                            });
                            setFbStatus('IDLE');
                            sound.playBuzzer();
                          }}
                          className="px-3 py-1.5 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          DISCONNECT FIREBASE
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <div className="space-y-1">
                          <label className="text-gray-400">API KEY *</label>
                          <input 
                            type="password"
                            value={fbConfig.apiKey}
                            onChange={(e) => setFbConfig({...fbConfig, apiKey: e.target.value})}
                            placeholder="AIzaSy..."
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-400">PROJECT ID *</label>
                          <input 
                            type="text"
                            value={fbConfig.projectId}
                            onChange={(e) => setFbConfig({...fbConfig, projectId: e.target.value})}
                            placeholder="my-cool-game-123"
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-400">APP ID *</label>
                          <input 
                            type="text"
                            value={fbConfig.appId}
                            onChange={(e) => setFbConfig({...fbConfig, appId: e.target.value})}
                            placeholder="1:123456789:web:abcdef"
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-400">AUTH DOMAIN</label>
                          <input 
                            type="text"
                            value={fbConfig.authDomain}
                            onChange={(e) => setFbConfig({...fbConfig, authDomain: e.target.value})}
                            placeholder="my-cool-game-123.firebaseapp.com"
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-300"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          disabled={!fbConfig.apiKey || !fbConfig.projectId || !fbConfig.appId}
                          onClick={async () => {
                            setFbStatus('SAVING');
                            sound.playClick();
                            try {
                              // Save configuration locally
                              saveFirebaseConfig(fbConfig);
                              // Force re-init
                              const testDb = initFirebase();
                              if (testDb) {
                                // Attempt a test write of current questions/actors/settings to test connection
                                const success = await saveGameDataToCloud(
                                  questions1,
                                  questions2,
                                  actors,
                                  spinningTime,
                                  speakingTime
                                );
                                if (success) {
                                  setFbStatus('CONNECTED');
                                  sound.playSuccess();
                                } else {
                                  setFbStatus('ERROR');
                                  sound.playBuzzer();
                                }
                              } else {
                                setFbStatus('ERROR');
                                sound.playBuzzer();
                              }
                            } catch (err) {
                              setFbStatus('ERROR');
                              sound.playBuzzer();
                            }
                          }}
                          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded font-mono text-[10px] font-black tracking-widest cursor-pointer transition-colors"
                        >
                          CONNECT & ACTIVATE SYNC
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cloudinary Image Storage Section */}
                <div className="p-5 mt-6 rounded-2xl bg-slate-950 border border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-white font-mono flex items-center gap-2">
                      <Upload className="w-4 h-4 text-pink-400" />
                      CLOUDINARY IMAGE STORAGE
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        clStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'
                      }`} />
                      <span className={`text-[10px] font-mono font-bold tracking-widest ${
                        clStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-gray-500'
                      }`}>
                        {clStatus === 'CONNECTED' ? 'CLOUDINARY ACTIVE ✓' : 'LOCAL BASE64 FALLBACK'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    Connecting your Cloudinary account lets you upload high-resolution actor portraits and clue images directly to Cloudinary. This bypasses local storage size limits and guarantees high-speed CDN image loading for all players.
                  </p>

                  {clStatus === 'CONNECTED' ? (
                    <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-300 font-mono">CLOUDINARY UPLOADS ONLINE</h4>
                          <p className="text-[10px] text-emerald-500 font-mono mt-0.5">
                            Any actor or clue images uploaded will be securely stored in your Cloudinary library, and the high-performance URLs will be saved automatically.
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            saveCloudinaryConfig(null);
                            setClConfig({
                              cloudName: '',
                              uploadPreset: '',
                            });
                            setClStatus('IDLE');
                            sound.playBuzzer();
                          }}
                          className="px-3 py-1.5 border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 rounded font-mono text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          DISCONNECT CLOUDINARY
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                        <div className="space-y-1">
                          <label className="text-gray-400">CLOUD NAME *</label>
                          <input 
                            type="text"
                            value={clConfig.cloudName}
                            onChange={(e) => setClConfig({...clConfig, cloudName: e.target.value.trim()})}
                            placeholder="e.g. dxyz8521"
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-400">UNSIGNED UPLOAD PRESET *</label>
                          <input 
                            type="text"
                            value={clConfig.uploadPreset}
                            onChange={(e) => setClConfig({...clConfig, uploadPreset: e.target.value.trim()})}
                            placeholder="e.g. ml_default"
                            className="w-full bg-slate-900 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gray-300"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-1.5">
                        <button
                          type="button"
                          disabled={!clConfig.cloudName || !clConfig.uploadPreset}
                          onClick={() => {
                            saveCloudinaryConfig(clConfig);
                            setClStatus('CONNECTED');
                            sound.playSuccess();
                          }}
                          className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 disabled:pointer-events-none text-white rounded font-mono text-[10px] font-black tracking-widest cursor-pointer transition-colors"
                        >
                          SAVE & ACTIVATE CLOUDINARY
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}
            </>
          )}

        </div>
      </div>

      {/* ----------------------------------------------------
          EDIT/CREATE QUESTION MODAL
      ---------------------------------------------------- */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/85 flex justify-center items-center p-4">
          <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
            
            {/* Modal Title */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black tracking-widest text-white">
                {editQuestionId ? 'EDIT QUESTION CONFIG' : 'CREATE NEW QUESTION'}
              </h3>
              <button 
                onClick={() => { sound.playClick(); setIsQuestionModalOpen(false); }}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="space-y-4 text-xs font-mono">
              
              {/* Answer Field */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-300">CORRECT ANSWER *</label>
                <input 
                  type="text" 
                  value={formAnswer}
                  onChange={(e) => {
                    const ans = e.target.value;
                    setFormAnswer(ans.toUpperCase());
                    // reset hidden letters if size changes to prevent out of bounds
                    setFormHiddenLetters([]);
                  }}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-sm text-white tracking-widest font-black"
                  placeholder="E.G., BIOTECHNOLOGY"
                />
              </div>

              {/* --------------------------------------------------------
                  VISUAL HIDDEN LETTER CONFIGURATION
              -------------------------------------------------------- */}
              {formAnswer.trim().length > 0 && (
                <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl space-y-2">
                  <label className="block font-bold text-cyan-400">
                    CONFIGURE HIDDEN LETTERS (CLICK LETTERS TO HIDE THEM IN PLAY)
                  </label>
                  <p className="text-[10px] text-gray-400">
                    The highlighted orange letters will be hidden as underscores (_) on the projector screen until revealed.
                  </p>
                  
                  {/* Letter picker grids */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {Array.from(formAnswer).map((char, index) => {
                      if (char === ' ') {
                        return (
                          <div key={index} className="w-8 h-8 flex items-center justify-center text-slate-700 bg-transparent border border-transparent font-sans">
                            •
                          </div>
                        );
                      }
                      const isHidden = formHiddenLetters.includes(index);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleHiddenLetterInForm(index)}
                          className={`w-8 h-8 rounded-lg font-bold text-sm flex items-center justify-center cursor-pointer transition-all ${
                            isHidden 
                              ? 'bg-amber-500 text-slate-950 border border-amber-300 font-sans shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                              : 'bg-slate-900 text-slate-400 border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {char}
                        </button>
                      );
                    })}
                  </div>

                  {/* Auto selector shortcut */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={autoHideAlternativeLetters}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded text-[10px] text-gray-300 cursor-pointer"
                    >
                      AUTO SELECT ALTERNATE LETTERS
                    </button>
                  </div>
                </div>
              )}

              {/* Clue Hint sentence */}
              <div className="space-y-1">
                <label className="block font-bold text-gray-300">CLUE / TEXT DESCRIPTION</label>
                <input 
                  type="text" 
                  value={formClue}
                  onChange={(e) => setFormClue(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white"
                  placeholder="E.G., Using biology to develop new technologies!"
                />
              </div>

              {/* 3 Image Uploads */}
              <div className="space-y-3">
                <label className="block font-bold text-gray-300 uppercase tracking-widest text-xs">3 CLUE IMAGES (UPLOAD ONLY) *</label>
                <div className="grid grid-cols-3 gap-3">
                  {formImages.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="p-3 bg-slate-900 border border-white/5 hover:border-cyan-500/20 rounded-xl flex flex-col items-center justify-between text-center min-h-[140px] transition-all">
                      <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">IMAGE {imgIdx + 1}</span>
                      
                      {questionUploadingIndexes[imgIdx] ? (
                        <div className="w-16 h-16 rounded-lg border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-center mt-2 mb-2">
                          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                        </div>
                      ) : imgUrl ? (
                        <div className="relative w-16 h-16 rounded-lg border border-white/10 overflow-hidden group/thumb mt-2 mb-2">
                          <img src={imgUrl} alt={`Clue ${imgIdx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              const nextImgs = [...formImages];
                              nextImgs[imgIdx] = '';
                              setFormImages(nextImgs);
                              sound.playBuzzer();
                            }}
                            className="absolute inset-0 bg-black/85 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-rose-500 hover:text-rose-400 font-black text-[10px] tracking-widest transition-opacity cursor-pointer"
                          >
                            REMOVE
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg border border-dashed border-white/10 flex items-center justify-center text-gray-600 mt-2 mb-2">
                          <Upload className="w-5 h-5" />
                        </div>
                      )}

                      <label className={`w-full py-1.5 border text-[10px] rounded font-bold cursor-pointer text-center tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                        questionUploadingIndexes[imgIdx]
                          ? 'bg-slate-900 border-white/5 text-gray-500 cursor-not-allowed'
                          : 'bg-cyan-950 hover:bg-cyan-900 border-cyan-500/30 text-cyan-400'
                      }`}>
                        {questionUploadingIndexes[imgIdx] ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                            UPLOADING...
                          </>
                        ) : (
                          imgUrl ? 'REPLACE' : 'UPLOAD'
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={questionUploadingIndexes[imgIdx]}
                          onChange={async (e) => {
                            const rawFile = e.target.files?.[0];
                            if (rawFile) {
                              setQuestionUploadingIndexes(prev => {
                                const next = [...prev];
                                next[imgIdx] = true;
                                return next;
                              });
                              try {
                                const { file: compressedFile, base64: compressedBase64 } = await compressImage(rawFile);
                                
                                let url: string | null = null;

                                // 1. If Firebase is connected, use Firebase + Cloudinary automatic handler
                                if (isFirebaseConnected()) {
                                  try {
                                    if (editQuestionId) {
                                      url = await uploadAndAssociateQuestionImage(
                                        activeTab === 'CTRL_GUESS' ? 'q1' : 'q2',
                                        editQuestionId,
                                        imgIdx,
                                        compressedFile
                                      );
                                    } else {
                                      const path = `questions/temp/${Date.now()}_img${imgIdx}`;
                                      url = await uploadFileToStorage(compressedFile, path);
                                    }
                                  } catch (err) {
                                    console.error("Firebase Storage upload failed, falling back...", err);
                                  }
                                }

                                // 2. If Firebase not connected, but Cloudinary is configured, upload directly
                                if (!url && isCloudinaryConfigured()) {
                                  try {
                                    url = await uploadFileToCloudinary(compressedFile);
                                  } catch (err) {
                                    console.error("Cloudinary upload failed:", err);
                                  }
                                }

                                // 3. Fallback to local Base64 if needed
                                const finalUrl = url || compressedBase64;
                                const nextImgs = [...formImages];
                                nextImgs[imgIdx] = finalUrl;
                                setFormImages(nextImgs);
                                sound.playSuccess();
                              } catch (err) {
                                console.error("Failed to compress or upload image:", err);
                              } finally {
                                setQuestionUploadingIndexes(prev => {
                                  const next = [...prev];
                                  next[imgIdx] = false;
                                  return next;
                                });
                              }
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 font-mono italic">
                  * Note: Images are converted and stored as lightweight local Base64 strings, fully compatible with Firebase Firestore.
                </p>
              </div>

              {/* Row: Difficulty and Round */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-300">DIFFICULTY LEVEL</label>
                  <select
                    value={formDifficulty}
                    onChange={(e) => setFormDifficulty(e.target.value as any)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-300">ROUND NUMBER</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formRound}
                    onChange={(e) => setFormRound(Number(e.target.value) || 1)}
                    className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/5">
              <button
                onClick={() => { sound.playClick(); setIsQuestionModalOpen(false); }}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-gray-400 font-bold hover:text-white cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleSaveQuestion}
                disabled={!formAnswer.trim()}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-white font-bold tracking-wider cursor-pointer"
              >
                SAVE QUESTION
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

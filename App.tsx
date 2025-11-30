import React, { useState, useEffect } from 'react';
import { ExerciseConfig, ExerciseType, SessionStats } from './types';
import PoseTracker from './components/PoseTracker';
import ExerciseCard from './components/ExerciseCard';
import { generateWorkoutSummary } from './services/geminiService';

const EXERCISES: ExerciseConfig[] = [
  {
    id: ExerciseType.HAND_RAISE,
    name: "Dual Hand Reach",
    description: "Gentle overhead reaching to improve shoulder mobility.",
    instruction: "Slowly raise both hands above your head, then lower them.",
    difficulty: "Gentle",
    targetMuscles: ["Shoulders", "Upper Back"]
  },
  {
    id: ExerciseType.LEG_LIFT,
    name: "Seated Knee Lift",
    description: "Hip strengthening exercise suitable for standing or sitting.",
    instruction: "Lift one knee up gently towards your chest, then switch.",
    difficulty: "Moderate",
    targetMuscles: ["Hip Flexors", "Thighs"]
  },
  {
    id: ExerciseType.SIDE_BEND,
    name: "Torso Sway",
    description: "Lateral spine movement to reduce stiffness.",
    instruction: "Keep hips still. Gently lean your upper body to the left, then right.",
    difficulty: "Gentle",
    targetMuscles: ["Core", "Lower Back"]
  },
  {
    id: ExerciseType.NECK_ROTATION,
    name: "Visual Tracking",
    description: "Neck mobility and vestibular system engagement.",
    instruction: "Slowly turn your head to look left, then turn to look right.",
    difficulty: "Gentle",
    targetMuscles: ["Neck", "Vestibular System"]
  },
  {
    id: ExerciseType.ARM_EXTENSION,
    name: "T-Pose Expansion",
    description: "Chest opening and posture correction.",
    instruction: "Start hands at chest, open arms wide to the sides like a 'T'.",
    difficulty: "Gentle",
    targetMuscles: ["Chest", "Upper Back"]
  }
];

const App: React.FC = () => {
  const [activeExercise, setActiveExercise] = useState<ExerciseConfig | null>(null);
  const [stats, setStats] = useState<SessionStats>({ reps: 0, calories: 0, accuracy: 100, duration: 0 });
  const [coachingMsg, setCoachingMsg] = useState<string>("Initializing rehab session...");
  const [sessionActive, setSessionActive] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const handleStart = () => {
    if (activeExercise) {
      setStats({ reps: 0, calories: 0, accuracy: 100, duration: 0 });
      setSessionActive(true);
      setShowSummary(false);
      setCoachingMsg("System Ready. Move gently.");
    }
  };

  const handleStop = async () => {
    setSessionActive(false);
    setShowSummary(true);
    setSummaryText("Analyzing movement patterns...");
    if (activeExercise) {
      const summary = await generateWorkoutSummary(activeExercise.id, stats);
      setSummaryText(summary);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Header */}
      <header className="w-full p-6 flex justify-between items-center border-b border-gray-800 bg-black/80 backdrop-blur z-10">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-cyan-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/50">
             <span className="font-bold text-xl text-black">M</span>
           </div>
           <h1 className="text-2xl font-vr font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-500">
             MEDHASHA VR
           </h1>
        </div>
        <div className="text-xs text-gray-500 font-mono hidden sm:block">
          REHAB MODULE // ONLINE
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row h-[calc(100vh-80px)]">
        
        {/* Left Panel: Exercise Selection or Stats */}
        <div className={`
          flex-1 p-6 overflow-y-auto transition-all duration-500
          ${sessionActive ? 'md:w-1/4 max-w-sm hidden md:block' : 'w-full'}
        `}>
          {!sessionActive ? (
            <>
              <div className="mb-8">
                <h2 className="text-4xl font-light mb-2">Select Therapy</h2>
                <p className="text-gray-400">Gentle movements for neurological recovery.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {EXERCISES.map(ex => (
                  <ExerciseCard 
                    key={ex.id} 
                    exercise={ex} 
                    onSelect={setActiveExercise} 
                    selected={activeExercise?.id === ex.id}
                  />
                ))}
              </div>
            </>
          ) : (
             <div className="h-full flex flex-col gap-6">
                <div className="bg-gray-900/80 p-6 rounded-2xl border border-gray-800">
                  <h3 className="text-gray-400 text-sm mb-1">THERAPY MODULE</h3>
                  <div className="text-2xl font-bold text-white mb-4">{activeExercise?.name}</div>
                  <div className="space-y-4 font-mono">
                    <div className="flex justify-between items-end border-b border-gray-800 pb-2">
                      <span className="text-gray-500">REPS</span>
                      <span className="text-4xl text-green-400 neon-text">{stats.reps}</span>
                    </div>
                     <div className="flex justify-between items-end pb-2">
                      <span className="text-gray-500">STABILITY</span>
                      <span className={`text-xl ${stats.accuracy > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {Math.round(stats.accuracy)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-gradient-to-b from-gray-900/50 to-transparent p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-pulse"></div>
                   <h3 className="text-green-500 text-xs font-vr mb-2">ASSISTANT FEEDBACK</h3>
                   <p className="text-lg leading-relaxed text-gray-200 italic">
                     "{coachingMsg}"
                   </p>
                </div>

                <button 
                  onClick={handleStop}
                  className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors font-vr border border-gray-600"
                >
                  END SESSION
                </button>
             </div>
          )}
        </div>

        {/* Right/Center Panel: Camera & Action */}
        <div className={`
          relative flex flex-col items-center justify-center p-6 bg-black/50
          ${sessionActive ? 'flex-1' : 'hidden md:flex md:w-1/3'}
        `}>
           {!sessionActive && activeExercise && (
             <div className="max-w-md w-full text-center space-y-6 animate-fade-in">
               <div className="w-full aspect-video bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-green-900/20 to-cyan-900/20"></div>
                  <div className="text-6xl text-gray-700 font-vr group-hover:scale-110 transition-transform duration-700">VR</div>
               </div>
               <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{activeExercise.name}</h2>
                  <p className="text-gray-400 text-lg">{activeExercise.instruction}</p>
               </div>
               <button 
                onClick={handleStart}
                className="px-12 py-4 bg-green-500 hover:bg-green-400 text-black font-bold text-xl rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(34,211,100,0.4)] font-vr"
               >
                 START THERAPY
               </button>
             </div>
           )}

           {!sessionActive && !activeExercise && (
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-4 opacity-20">?</div>
                <p>Select a therapy module from the left panel.</p>
              </div>
           )}

           {sessionActive && activeExercise && (
             <div className="w-full h-full max-h-[800px] relative">
               <PoseTracker 
                  activeExercise={activeExercise}
                  onStatsUpdate={setStats}
                  onCoachingMessage={setCoachingMsg}
               />
             </div>
           )}
        </div>
      </main>
      
      {/* Sticky Start Button for Mobile if not active */}
      {!sessionActive && activeExercise && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
          <button 
            onClick={handleStart}
            className="w-full py-4 bg-green-500 text-black font-bold text-lg rounded-xl shadow-lg font-vr"
          >
            START {activeExercise.name}
          </button>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full bg-gray-900 border border-green-500/50 rounded-2xl p-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-cyan-500 to-green-500"></div>
             
             <h2 className="text-3xl font-vr text-white mb-6 text-center">SESSION COMPLETE</h2>
             
             <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="text-center p-4 bg-gray-800 rounded-lg">
                 <div className="text-2xl font-bold text-green-400">{stats.reps}</div>
                 <div className="text-xs text-gray-500">REPS COMPLETED</div>
               </div>
               <div className="text-center p-4 bg-gray-800 rounded-lg">
                 <div className="text-2xl font-bold text-cyan-400">{Math.round(stats.accuracy)}%</div>
                 <div className="text-xs text-gray-500">STABILITY SCORE</div>
               </div>
             </div>

             <div className="bg-black/40 p-6 rounded-xl border border-gray-800 mb-8">
               <h4 className="text-green-500 text-xs font-bold mb-2">THERAPY REPORT</h4>
               <p className="text-gray-300 leading-relaxed">
                 {summaryText}
               </p>
             </div>

             <div className="flex gap-4">
               <button 
                 onClick={() => { setShowSummary(false); setActiveExercise(null); }}
                 className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
               >
                 MENU
               </button>
               <button 
                 onClick={handleStart}
                 className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors font-bold shadow-[0_0_15px_rgba(22,163,74,0.4)]"
               >
                 RETRY
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
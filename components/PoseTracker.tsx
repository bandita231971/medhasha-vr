import React, { useEffect, useRef, useState } from 'react';
import { ExerciseType, ExerciseConfig, PoseResults, SessionStats } from '../types';
import { calculateAngle, drawNeonSkeleton } from '../utils/geometry';
import { generateCoachingTip } from '../services/geminiService';

interface PoseTrackerProps {
  activeExercise: ExerciseConfig;
  onStatsUpdate: (stats: SessionStats) => void;
  onCoachingMessage: (msg: string) => void;
}

const PoseTracker: React.FC<PoseTrackerProps> = ({ activeExercise, onStatsUpdate, onCoachingMessage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [instructionText, setInstructionText] = useState("Prepare Position");

  // Stats Refs
  const statsRef = useRef<SessionStats>({ reps: 0, calories: 0, accuracy: 100, duration: 0 });
  const exerciseStateRef = useRef<'PHASE_1' | 'PHASE_2' | 'NEUTRAL'>('NEUTRAL');
  const lastCoachingTimeRef = useRef<number>(0);
  const lastRepTimeRef = useRef<number>(0);
  
  // Initialize MediaPipe
  useEffect(() => {
    let camera: any = null;
    let pose: any = null;

    const onResults = (results: PoseResults) => {
      setLoading(false);
      const videoWidth = videoRef.current?.videoWidth || 640;
      const videoHeight = videoRef.current?.videoHeight || 480;

      if (canvasRef.current) {
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;
        const ctx = canvasRef.current.getContext('2d');
        
        if (ctx) {
          ctx.clearRect(0, 0, videoWidth, videoHeight);
          
          // Draw image from video
          ctx.save();
          // Mirror the image
          ctx.scale(-1, 1);
          ctx.translate(-videoWidth, 0);
          ctx.drawImage(results.segmentationMask || videoRef.current!, 0, 0, videoWidth, videoHeight);
          
          // Subtle dark overlay for contrast
          ctx.fillStyle = 'rgba(10, 20, 10, 0.4)'; 
          ctx.fillRect(0, 0, videoWidth, videoHeight);
          ctx.restore();

          if (results.poseLandmarks) {
            drawNeonSkeleton(ctx, results.poseLandmarks);
            processRehabLogic(results.poseLandmarks);
          }
        }
      }
    };

    if (window.Pose) {
      pose = new window.Pose({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults(onResults);

      if (videoRef.current && window.Camera) {
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && pose) {
              await pose.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });
        camera.start();
      }
    }

    return () => {
      if (camera) camera.stop();
      if (pose) pose.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // New Logic specifically for Rehab/Neuro Patients (Gentle thresholds)
  const processRehabLogic = (landmarks: any[]) => {
    if (landmarks.length < 33) return;

    // Key Landmarks
    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];

    let isFormCorrect = true; // Assume good form unless detected otherwise
    let currentPhase: 'PHASE_1' | 'PHASE_2' | 'NEUTRAL' = 'NEUTRAL';
    const now = Date.now();

    // Debounce reps (prevent double counting jittery movements)
    if (now - lastRepTimeRef.current < 2000) return;

    switch (activeExercise.id) {
      case ExerciseType.HAND_RAISE: {
        // Simple Vertical Raise
        // PHASE 1: Hands above nose
        // PHASE 2: Hands below shoulders
        const handsUp = leftWrist.y < nose.y && rightWrist.y < nose.y;
        const handsDown = leftWrist.y > leftShoulder.y && rightWrist.y > rightShoulder.y;

        if (handsUp) {
          currentPhase = 'PHASE_1';
          setInstructionText("Hold... Now Relax");
        } else if (handsDown) {
          currentPhase = 'PHASE_2';
          setInstructionText("Slowly Raise Arms");
        } else {
           setInstructionText("Keep Going");
        }
        break;
      }

      case ExerciseType.LEG_LIFT: {
        // Seated Marching
        // Check if either knee is significantly higher than neutral
        // Using relative difference between hip and knee Y.
        // Y increases downwards. Smaller Y = Higher up.
        
        // Neutral: Knee is much lower than hip (approx > 0.3 difference usually)
        // Active: Knee Y is close to Hip Y (difference < 0.15)
        
        const leftLifted = (leftHip.y - leftKnee.y) < 0.15; // Knee getting close to hip height
        const rightLifted = (rightHip.y - rightKnee.y) < 0.15;

        if (leftLifted || rightLifted) {
          currentPhase = 'PHASE_1';
          setInstructionText("Good. Lower Leg.");
        } else {
          currentPhase = 'PHASE_2';
          setInstructionText("Lift One Knee");
        }
        break;
      }

      case ExerciseType.SIDE_BEND: {
        // Calculate angle of the shoulder line relative to horizontal
        // atan2(dy, dx)
        const radians = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
        const deg = Math.abs(radians * 180 / Math.PI);
        
        // Normal horizontal line is 0 or 180. But since we are looking at L to R...
        // If perfectly straight, diff in Y is 0.
        // If bent, Y diff increases.
        const tilt = Math.abs(rightShoulder.y - leftShoulder.y);

        if (tilt > 0.15) { // Significant tilt
          currentPhase = 'PHASE_1';
          setInstructionText("Center Your Body");
        } else {
          currentPhase = 'PHASE_2';
          setInstructionText("Lean Side to Side");
        }
        break;
      }

      case ExerciseType.NECK_ROTATION: {
        // Visual Tracking / Head Turns
        // Compare Nose X position relative to Shoulders
        // Midpoint of shoulders
        const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
        
        const distFromCenter = nose.x - midShoulderX;
        
        // If nose moves > 25% of shoulder width to side
        if (Math.abs(distFromCenter) > (shoulderWidth * 0.25)) {
           currentPhase = 'PHASE_1';
           setInstructionText("Return to Center");
        } else {
           currentPhase = 'PHASE_2';
           setInstructionText("Look Left or Right");
        }
        break;
      }

      case ExerciseType.ARM_EXTENSION: {
        // T-Pose
        // Wrists should be roughly same Y as shoulders, and far apart
        const wristDist = Math.abs(leftWrist.x - rightWrist.x);
        const shoulderDist = Math.abs(leftShoulder.x - rightShoulder.x);
        
        // Expanded: Wrist distance > 2.5x shoulder width
        if (wristDist > (shoulderDist * 2.5)) {
          currentPhase = 'PHASE_1';
          setInstructionText("Bring Hands Together");
        } else if (wristDist < (shoulderDist * 1.5)) {
          currentPhase = 'PHASE_2';
          setInstructionText("Open Arms Wide");
        }
        break;
      }
    }

    // State Machine
    // We count a rep when user completes the difficult action (PHASE_1) and returns or transitions
    // Simplified: Just detect hitting PHASE_1 if coming from NEUTRAL/PHASE_2
    
    if (currentPhase === 'PHASE_1' && exerciseStateRef.current !== 'PHASE_1') {
       // Hold logic? For now, instant credit is more encouraging for this demographic
       incrementRep(isFormCorrect);
       exerciseStateRef.current = 'PHASE_1';
       lastRepTimeRef.current = now;
    } else if (currentPhase === 'PHASE_2') {
       exerciseStateRef.current = 'PHASE_2';
    }
  };

  const incrementRep = (goodForm: boolean) => {
    statsRef.current = {
      ...statsRef.current,
      reps: statsRef.current.reps + 1,
      // Lower calorie count for rehab
      calories: statsRef.current.calories + 0.1, 
      accuracy: goodForm ? Math.min(100, statsRef.current.accuracy + 0.5) : Math.max(0, statsRef.current.accuracy - 1)
    };
    onStatsUpdate({...statsRef.current});
    checkAiFeedback();
  };

  const checkAiFeedback = async () => {
    const now = Date.now();
    // Less frequent updates for rehab (12s) to not overwhelm
    if (now - lastCoachingTimeRef.current > 12000) {
      lastCoachingTimeRef.current = now;
      const tip = await generateCoachingTip(activeExercise.id, statsRef.current);
      onCoachingMessage(tip);
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-green-400 font-vr animate-pulse">CALIBRATING THERAPY SENSORS...</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="absolute w-full h-full object-cover opacity-0" 
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute w-full h-full object-contain transform -scale-x-100" // Mirror CSS
      />
      
      {/* Real-time Instruction Overlay - High Contrast for Accessibility */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
         <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-full border-2 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.5)]">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wider font-vr text-center">
              {instructionText}
            </h2>
         </div>
      </div>
      
      {/* HUD Overlay */}
      <div className="absolute top-4 left-4 p-2 bg-black/60 backdrop-blur-md rounded border border-green-500/30">
        <p className="text-xs text-green-300 font-vr">SENSOR.ACTIVE</p>
        <p className="text-xs text-white">{activeExercise.name.toUpperCase()}</p>
      </div>
    </div>
  );
};

export default PoseTracker;
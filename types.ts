export enum ExerciseType {
  HAND_RAISE = 'HAND_RAISE',
  LEG_LIFT = 'LEG_LIFT',
  SIDE_BEND = 'SIDE_BEND',
  NECK_ROTATION = 'NECK_ROTATION',
  ARM_EXTENSION = 'ARM_EXTENSION'
}

export interface ExerciseConfig {
  id: ExerciseType;
  name: string;
  description: string;
  instruction: string;
  difficulty: 'Gentle' | 'Moderate';
  targetMuscles: string[];
}

export interface PoseLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface PoseResults {
  poseLandmarks: PoseLandmark[];
  poseWorldLandmarks: PoseLandmark[];
  segmentationMask: any;
}

// Stats for a session
export interface SessionStats {
  reps: number;
  calories: number;
  accuracy: number; // 0-100
  duration: number; // seconds
}

// For window global access to MediaPipe
declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}
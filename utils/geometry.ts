import { PoseLandmark } from '../types';

/**
 * Calculates the angle between three points (A, B, C) where B is the vertex.
 */
export const calculateAngle = (a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number => {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180.0) / Math.PI);

  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
};

/**
 * Draws a futuristic neon skeleton.
 */
export const drawNeonSkeleton = (ctx: CanvasRenderingContext2D, landmarks: PoseLandmark[]) => {
  if (!landmarks || landmarks.length === 0) return;

  const connections = window.POSE_CONNECTIONS;
  if (!connections) return;

  // 1. Draw Connections (Bones)
  ctx.save();
  connections.forEach((pair: [number, number]) => {
    const start = landmarks[pair[0]];
    const end = landmarks[pair[1]];

    if (start.visibility > 0.5 && end.visibility > 0.5) {
      ctx.beginPath();
      ctx.moveTo(start.x * ctx.canvas.width, start.y * ctx.canvas.height);
      ctx.lineTo(end.x * ctx.canvas.width, end.y * ctx.canvas.height);
      
      // Neon Gradient for lines
      const gradient = ctx.createLinearGradient(
        start.x * ctx.canvas.width, start.y * ctx.canvas.height,
        end.x * ctx.canvas.width, end.y * ctx.canvas.height
      );
      gradient.addColorStop(0, '#00f3ff'); // Cyan
      gradient.addColorStop(1, '#bc13fe'); // Neon Purple
      
      ctx.lineWidth = 4;
      ctx.strokeStyle = gradient;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
  });
  ctx.restore();

  // 2. Draw Landmarks (Joints)
  landmarks.forEach((landmark) => {
    if (landmark.visibility > 0.5) {
      const x = landmark.x * ctx.canvas.width;
      const y = landmark.y * ctx.canvas.height;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#bc13fe';
      ctx.shadowBlur = 15;
      ctx.fill();

      // Coordinates text (Techy look)
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.fillText(`[${landmark.x.toFixed(2)},${landmark.y.toFixed(2)}]`, x + 10, y - 10);
    }
  });
};
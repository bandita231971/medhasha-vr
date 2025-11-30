import React from 'react';
import { ExerciseConfig } from '../types';

interface ExerciseCardProps {
  exercise: ExerciseConfig;
  onSelect: (ex: ExerciseConfig) => void;
  selected?: boolean;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onSelect, selected }) => {
  return (
    <div 
      onClick={() => onSelect(exercise)}
      className={`
        relative overflow-hidden p-6 rounded-xl cursor-pointer transition-all duration-300 border-2
        group hover:scale-105
        ${selected 
          ? 'bg-cyan-900/20 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
          : 'bg-gray-900/60 border-gray-700 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'}
      `}
    >
      <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
        <div className={`
          text-xs font-bold px-2 py-1 rounded
          ${exercise.difficulty === 'Gentle' ? 'bg-green-500/20 text-green-400' : 
            exercise.difficulty === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}
        `}>
          {exercise.difficulty}
        </div>
      </div>
      
      <h3 className="text-xl font-vr font-bold text-white mb-2">{exercise.name}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">{exercise.description}</p>
      
      <div className="flex flex-wrap gap-2">
        {exercise.targetMuscles.map(muscle => (
          <span key={muscle} className="text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded-full border border-purple-500/30">
            {muscle}
          </span>
        ))}
      </div>

      {selected && (
        <div className="absolute bottom-0 right-0 p-4">
           <div className="w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;

import React from 'react';

interface ProgressTrackerProps {
  current: number;
  total: number;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ current, total }) => {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full bg-indigo-50 pt-6 px-8">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Overall Progress</span>
        <span className="text-sm font-bold text-indigo-600">{current} / {total}</span>
      </div>
      <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressTracker;

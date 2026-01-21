
import React, { useMemo } from 'react';
import { UserAnswer } from '../types';
import { QUESTIONS_DATA } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ResultDashboardProps {
  answers: UserAnswer[];
  onReset: () => void;
}

const ResultDashboard: React.FC<ResultDashboardProps> = ({ answers, onReset }) => {
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalCount = answers.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Advanced analysis for accuracy breakdown
  const stats = useMemo(() => {
    const categories = {
      comparative: { correct: 0, total: 0 },
      superlative: { correct: 0, total: 0 }
    };

    answers.forEach(ans => {
      const q = QUESTIONS_DATA.find(item => item.id === ans.questionId);
      if (q) {
        categories[q.type].total++;
        if (ans.isCorrect) categories[q.type].correct++;
      }
    });

    const getPerc = (cat: 'comparative' | 'superlative') => 
      categories[cat].total === 0 ? 0 : Math.round((categories[cat].correct / categories[cat].total) * 100);

    return {
      comparative: getPerc('comparative'),
      superlative: getPerc('superlative'),
    };
  }, [answers]);

  const data = useMemo(() => [
    { name: 'Correct', value: correctCount },
    { name: 'Incorrect', value: totalCount - correctCount },
  ], [correctCount, totalCount]);

  const COLORS = ['#10b981', '#f43f5e'];

  const getEncouragement = () => {
    if (percentage === 100) return "Master of Adjectives! 🏆";
    if (percentage >= 80) return "Excellent Work! 🌟";
    if (percentage >= 50) return "Good Progress! 👍";
    return "Keep Practicing! 💪";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* Left: Summary Stats */}
          <div className="p-10 lg:p-14 bg-indigo-600 text-white flex flex-col justify-center">
            <h2 className="text-sm font-bold uppercase tracking-widest mb-4 opacity-75">Quiz Completed</h2>
            <h1 className="text-5xl font-black mb-4 leading-tight">{getEncouragement()}</h1>
            <p className="text-indigo-100 text-lg mb-8 opacity-90">
              You correctly answered {correctCount} out of {totalCount} questions.
            </p>
            <div className="flex items-center space-x-4 sm:space-x-6">
               <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Final Score</p>
                  <p className="text-3xl font-black">{percentage}%</p>
               </div>
               <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1 border border-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-70">Correct</p>
                  <p className="text-3xl font-black">{correctCount}</p>
               </div>
            </div>
            <button 
              onClick={onReset}
              className="mt-10 bg-white text-indigo-600 hover:bg-indigo-50 font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
            >
              Restart Session
            </button>
          </div>

          {/* Right: Visualization & Details */}
          <div className="p-10 lg:p-14 flex flex-col items-center justify-center bg-slate-50/50">
            <div className="w-full h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-6">
               <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-center mb-2">Category Accuracy</h3>
               
               <div className="space-y-4">
                  {/* Comparatives */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase">
                      <span className="text-slate-600">Comparatives</span>
                      <span className="text-indigo-600">{stats.comparative}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-1000" 
                        style={{ width: `${stats.comparative}%` }}
                      />
                    </div>
                  </div>

                  {/* Superlatives */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase">
                      <span className="text-slate-600">Superlatives</span>
                      <span className="text-purple-600">{stats.superlative}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500 transition-all duration-1000" 
                        style={{ width: `${stats.superlative}%` }}
                      />
                    </div>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultDashboard;


import React, { useState, useEffect } from 'react';
import { Question } from '../types';
import { getGrammarHint } from '../utils/grammarRules';

interface QuestionCardProps {
  question: Question;
  onNext: (answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({ question, onNext }) => {
  const [inputValue, setInputValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setInputValue('');
    setSubmitted(false);
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSubmitted(true);
  };

  const handleContinue = () => {
    onNext(inputValue);
  };

  const isCorrect = inputValue.trim().toLowerCase() === question.correctAnswer.toLowerCase();
  const ruleHint = getGrammarHint(question);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider rounded-md border border-indigo-100">
          {question.type}
        </span>
        <h2 className="text-2xl font-medium text-slate-800 leading-snug">
          {question.question.split('___').map((part, i, arr) => (
            <React.Fragment key={i}>
              {part}
              {i < arr.length - 1 && (
                <span className={`inline-block border-b-2 px-4 py-0 min-w-[120px] font-bold ${submitted ? (isCorrect ? 'text-emerald-600 border-emerald-500' : 'text-rose-600 border-rose-500') : 'text-indigo-600 border-indigo-500'}`}>
                  {submitted ? (inputValue || '___') : '___'}
                </span>
              )}
            </React.Fragment>
          ))}
        </h2>
        <div className="flex items-center space-x-2 text-slate-500">
          <span className="text-sm">Adjective:</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded font-mono font-bold text-slate-700 uppercase text-sm">{question.adjective}</span>
        </div>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your answer..."
            className="w-full px-6 py-5 text-xl border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all shadow-sm"
          />
          <button
            disabled={!inputValue.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
          >
            Check Answer
          </button>
        </form>
      ) : (
        <div className="space-y-6 animate-in zoom-in-95 duration-300">
          <div className={`p-6 rounded-2xl flex items-center space-x-4 ${isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'} text-white text-2xl shadow-sm`}>
              {isCorrect ? '✓' : '✕'}
            </div>
            <div>
              <p className="font-bold text-lg">{isCorrect ? 'Correct!' : 'Incorrect'}</p>
              {!isCorrect && (
                <p>The correct form is: <span className="underline font-bold decoration-rose-300">{question.correctAnswer}</span></p>
              )}
            </div>
          </div>

          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-700 delay-150">
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center mb-2">
                <span className="text-indigo-600 mr-2 text-xl">💡</span>
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Grammar Rule</span>
              </div>
              <p className="text-slate-700 leading-relaxed font-medium">
                {ruleHint}
              </p>
            </div>
            
            <button
              onClick={handleContinue}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center"
            >
              Continue to Next <span className="ml-2">→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionCard;

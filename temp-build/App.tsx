
import React, { useState, useMemo, useEffect } from 'react';
import { QUESTIONS_DATA } from './constants';
import { Question, QuizState, UserAnswer } from './types';
import QuestionCard from './components/QuestionCard';
import ProgressTracker from './components/ProgressTracker';
import ResultDashboard from './components/ResultDashboard';
import LandingPage from './components/LandingPage';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const App: React.FC = () => {
  const [started, setStarted] = useState(false);
  // Store shuffled questions in state so they persist through a single session
  const [questions, setQuestions] = useState<Question[]>([]);
  
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: [],
    isFinished: false,
    streak: 0,
  });

  // Initialize questions on mount
  useEffect(() => {
    setQuestions(shuffleArray(QUESTIONS_DATA));
  }, []);

  const currentQuestion = useMemo(() => 
    questions[quizState.currentQuestionIndex], 
    [questions, quizState.currentQuestionIndex]
  );

  const handleStart = () => {
    setStarted(true);
  };

  const handleAnswerSubmit = (answer: string) => {
    if (!currentQuestion) return;

    const isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    
    const newUserAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      userValue: answer,
      isCorrect,
      timestamp: Date.now()
    };

    setQuizState(prev => {
      const isNextLast = prev.currentQuestionIndex === questions.length - 1;
      return {
        ...prev,
        answers: [...prev.answers, newUserAnswer],
        currentQuestionIndex: isNextLast ? prev.currentQuestionIndex : prev.currentQuestionIndex + 1,
        isFinished: isNextLast,
        streak: isCorrect ? prev.streak + 1 : 0
      };
    });
  };

  const handleReset = () => {
    // Re-shuffle for the next attempt
    setQuestions(shuffleArray(QUESTIONS_DATA));
    setQuizState({
      currentQuestionIndex: 0,
      answers: [],
      isFinished: false,
      streak: 0,
    });
    setStarted(false);
  };

  if (!started) {
    return <LandingPage onStart={handleStart} />;
  }

  if (quizState.isFinished) {
    return <ResultDashboard answers={quizState.answers} onReset={handleReset} />;
  }

  // Safety check if questions haven't loaded yet
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-indigo-600 px-8 py-6 flex justify-between items-center text-white">
          <h1 className="text-2xl font-bold tracking-tight">Grammar Master</h1>
          <div className="flex items-center space-x-2 bg-indigo-500/50 px-3 py-1 rounded-full border border-indigo-400">
            <span className="text-sm font-medium">Streak:</span>
            <span className="text-lg font-bold">{quizState.streak}</span>
            <span className="text-xl">🔥</span>
          </div>
        </div>

        <ProgressTracker 
          current={quizState.currentQuestionIndex + 1} 
          total={questions.length} 
        />

        <div className="p-8">
          <QuestionCard 
            question={currentQuestion} 
            onNext={handleAnswerSubmit} 
          />
        </div>
      </div>
      
      <div className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
        Educational Tool &bull; Comparatives & Superlatives
      </div>
    </div>
  );
};

export default App;

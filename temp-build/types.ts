
export interface Question {
  id: number;
  question: string;
  adjective: string;
  correctAnswer: string;
  type: 'comparative' | 'superlative';
}

export interface UserAnswer {
  questionId: number;
  userValue: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: UserAnswer[];
  isFinished: boolean;
  streak: number;
}

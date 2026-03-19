import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: string;
  options: Array<{ id: number; option_text: string }>;
}

interface QuizData {
  sessionId: number;
  questions: QuizQuestion[];
}

interface QuizSubmitResponse {
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  topicScores: Record<string, number>;
  feedback: string;
}

export const QuizPlayer: React.FC = () => {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('/api/quiz/weekly', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(response.data);
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
      }
    };

    fetchQuiz();
  }, []);

  const handleSelectAnswer = (optionId: number) => {
    setAnswers({
      ...answers,
      [quiz!.questions[currentIndex].id]: optionId,
    });
  };

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.post<QuizSubmitResponse>(
        `/api/quiz/${quiz!.sessionId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScore(response.data.score);
      setResult(response.data);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    }
  };

  if (!quiz) return <div>Loading quiz...</div>;
  if (submitted) {
    return (
      <div className="quiz-result">
        <h2>Quiz Complete!</h2>
        <p>Your Score: <strong>{score}%</strong></p>
        {result && (
          <p>
            Correct Answers: <strong>{result.correctAnswers}</strong> / {result.totalQuestions}
          </p>
        )}
        <button onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const question = quiz.questions[currentIndex];
  const isAnswered = question.id in answers;

  return (
    <div className="quiz-container">
      <div className="quiz-progress">
        Question {currentIndex + 1} of {quiz.questions.length}
      </div>
      <div className="quiz-question">
        <h3>{question.question_text}</h3>
        <div className="quiz-options">
          {question.options.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name={`q${question.id}`}
                checked={answers[question.id] === option.id}
                onChange={() => handleSelectAnswer(option.id)}
              />
              {option.option_text}
            </label>
          ))}
        </div>
      </div>
      <div className="quiz-actions">
        <button
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </button>
        {currentIndex < quiz.questions.length - 1 ? (
          <button onClick={() => setCurrentIndex(currentIndex + 1)}>
            Next
          </button>
        ) : (
          <button onClick={handleSubmitQuiz} disabled={!isAnswered}>
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
};

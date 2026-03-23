import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, QuizReviewPayload } from '../lib/api';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [result, setResult] = useState<QuizSubmitResponse | null>(null);
  const [review, setReview] = useState<QuizReviewPayload | null>(null);
  const [redoLoading, setRedoLoading] = useState(false);

  useEffect(() => {
    const loadQuizPage = async () => {
      try {
        const reviewSessionId = searchParams.get('reviewSessionId');
        if (reviewSessionId) {
          const reviewPayload = await api.getQuizReview(Number(reviewSessionId));
          setReview(reviewPayload);
          setQuiz(null);
          return;
        }

        const redoSessionId = searchParams.get('redoSessionId');
        if (redoSessionId) {
          const redoPayload = await api.redoQuiz(Number(redoSessionId));
          setReview(null);
          setQuiz(redoPayload);
          return;
        }

        const quizMode = searchParams.get('mode');
        const response = quizMode === 'monthly'
          ? await api.getMonthlyQuiz()
          : await api.getWeeklyQuiz();
        setReview(null);
        setQuiz(response);
      } catch (err) {
        console.error('Failed to fetch quiz:', err);
        setError('Could not load quiz for the current user.');
      } finally {
        setLoading(false);
      }
    };

    loadQuizPage();
  }, [searchParams]);

  const handleSelectAnswer = (optionId: number) => {
    setAnswers({
      ...answers,
      [quiz!.questions[currentIndex].id]: optionId,
    });
  };

  const handleSubmitQuiz = async () => {
    try {
      const response = await api.submitQuizAnswers(quiz!.sessionId, answers) as QuizSubmitResponse;
      setScore(response.score);
      setResult(response);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit quiz:', err);
    }
  };

  const handleRedoQuiz = async () => {
    if (!review) {
      return;
    }

    setRedoLoading(true);
    try {
      const redoPayload = await api.redoQuiz(review.sessionId);
      setReview(null);
      setQuiz(redoPayload);
      setAnswers({});
      setCurrentIndex(0);
      setSubmitted(false);
      setScore(null);
      setResult(null);
      navigate('/quiz', { replace: true });
    } catch (err) {
      console.error('Failed to redo quiz:', err);
      setError('Could not start redo quiz. Please try again.');
    } finally {
      setRedoLoading(false);
    }
  };

  if (loading) return <div>Loading quiz...</div>;
  if (review) {
    return (
      <div className="quiz-shell">
        <div className="quiz-container quiz-modern">
          <h2>Quiz Review</h2>
          <p className="panel-subtitle">
            {review.sessionType.toUpperCase()} session completed on{' '}
            {new Date(review.completedAt).toLocaleString()} | Score: <strong>{review.totalScore.toFixed(1)}%</strong>
          </p>
          <div className="review-list">
            {review.questions.map((question, index) => (
              <article key={question.questionId} className="review-card">
                <h3>
                  Question {index + 1}: {question.questionText}
                </h3>
                <div className="review-options">
                  {question.options.map((option) => {
                    const isSelected = option.id === question.selectedOptionId;
                    const isCorrect = option.id === question.correctOptionId;
                    return (
                      <div
                        key={option.id}
                        className={`review-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''}`}
                      >
                        <span>{option.option_text}</span>
                        <div className="review-badges">
                          {isSelected && <em>Your answer</em>}
                          {isCorrect && <strong>Correct</strong>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
          <div className="quiz-actions">
            <button type="button" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
            <button type="button" onClick={handleRedoQuiz} disabled={redoLoading}>
              {redoLoading ? 'Preparing redo...' : 'Redo this quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-container">
        <h2>Quiz unavailable</h2>
        <p>{error}</p>
        <p>
          Seed demo data first: <a href="/demo-user">Create demo user data</a>
        </p>
      </div>
    );
  }
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

  const questionTypeLabel =
    question.question_type === 'true_false'
      ? 'True / False'
      : question.question_type === 'fill_blank'
        ? 'Fill In The Blank'
        : question.question_type === 'case_study_real'
          ? 'Case Study (Real Incident)'
          : question.question_type === 'case_study_fake'
            ? 'Case Study (Simulated Scenario)'
        : 'Multiple Choice';

  const isCaseStudy = question.question_type.startsWith('case_study');
  const caseStudyMatch = isCaseStudy
    ? question.question_text.match(/^Case Study \((Real|Simulated)\):\s*([\s\S]*?)\n\nQuestion:\s*([\s\S]*)$/)
    : null;
  const caseStudyType = caseStudyMatch?.[1] ?? (question.question_type === 'case_study_real' ? 'Real' : 'Simulated');
  const caseStudyBody = caseStudyMatch?.[2] ?? question.question_text;
  const caseStudyPrompt = caseStudyMatch?.[3] ?? question.question_text;

  const renderOptionControl = (option: { id: number; option_text: string }) => {
    const checked = answers[question.id] === option.id;

    if (question.question_type === 'true_false') {
      return (
        <button
          key={option.id}
          type="button"
          className={`quiz-option-button ${checked ? 'selected' : ''}`}
          onClick={() => handleSelectAnswer(option.id)}
        >
          {option.option_text}
        </button>
      );
    }

    return (
      <label key={option.id} className={`quiz-option-card ${checked ? 'selected' : ''}`}>
        <input
          type="radio"
          name={`q${question.id}`}
          checked={checked}
          onChange={() => handleSelectAnswer(option.id)}
        />
        <span>{option.option_text}</span>
      </label>
    );
  };

  return (
    <div className="quiz-shell">
      <div className="quiz-container quiz-modern">
        <div className="quiz-topbar">
          <div>
            <p className="quiz-type-label">{questionTypeLabel}</p>
            <div className="quiz-progress">
              Question {currentIndex + 1} of {quiz.questions.length}
            </div>
          </div>
          <div className="quiz-progress-meter">
            <div
              className="quiz-progress-meter-fill"
              style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="quiz-question">
          {isCaseStudy ? (
            <>
              <div className="case-study-card">
                <p className="case-study-meta">{caseStudyType.toUpperCase()} CASE STUDY</p>
                <p>{caseStudyBody}</p>
              </div>
              <h3>{caseStudyPrompt}</h3>
            </>
          ) : (
            <h3>{question.question_text}</h3>
          )}
          {question.question_type === 'fill_blank' && (
            <p className="quiz-hint">Select the best phrase to complete the statement.</p>
          )}
          <div
            className={`quiz-options ${question.question_type === 'true_false' ? 'quiz-options-inline' : ''}`}
          >
            {question.options.map(renderOptionControl)}
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
            <button onClick={() => setCurrentIndex(currentIndex + 1)} disabled={!isAnswered}>
              Next
            </button>
          ) : (
            <button onClick={handleSubmitQuiz} disabled={!isAnswered}>
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

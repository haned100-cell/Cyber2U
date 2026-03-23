import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, QuizHistoryItem, TopicHistoryPoint } from '../lib/api';

interface Progress {
  totalQuizzesCompleted: number;
  averageScore: number;
  improvementPercentage: number;
  topicScores: Record<string, number>;
}

export const LearnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const INTEREST_OPTIONS = useMemo(
    () => [
      { key: 'phishing', label: 'Phishing Scams' },
      { key: 'password_hygiene', label: 'Password Hygiene' },
      { key: 'social_engineering', label: 'Social Engineering' },
      { key: 'malware', label: 'Malware' },
      { key: 'ransomware', label: 'Ransomware' },
      { key: 'identity_theft', label: 'Identity Theft' },
      { key: 'data_privacy', label: 'Data Privacy' },
      { key: 'device_security', label: 'Device Security' },
      { key: 'safe_browsing', label: 'Safe Browsing' },
      { key: 'incident_response', label: 'Incident Response' },
    ],
    []
  );

  const [progress, setProgress] = useState<Progress | null>(null);
  const [interestTopics, setInterestTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
  const [topicHistory, setTopicHistory] = useState<TopicHistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);

  const yearlyQuizGoal = 24;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progressResponse, profileResponse] = await Promise.all([api.getProgress(), api.getProfile()]);
        setProgress(progressResponse);
        setInterestTopics(profileResponse.interestTopics || []);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
        setError('No authenticated user progress found yet.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const loadHistoryData = async () => {
    if (historyLoading) {
      return;
    }

    setHistoryLoading(true);
    try {
      const [topicHistoryResponse, quizHistoryResponse] = await Promise.all([
        api.getTopicHistory(),
        api.getQuizHistory(),
      ]);
      setTopicHistory(topicHistoryResponse);
      setQuizHistory(quizHistoryResponse);
    } catch (err) {
      console.error('Failed to fetch history data:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleTopic = (topic: string) => {
    setSaveMessage('');
    setSaveError('');
    setInterestTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]
    );
  };

  const saveInterests = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');
    try {
      const updatedTopics = await api.updateInterestTopics(interestTopics);
      setInterestTopics(updatedTopics);
      setSaveMessage('Saved your cybersecurity interest areas.');
    } catch (err: any) {
      setSaveError(err?.response?.data?.error || 'Failed to save your interest areas.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!progress) {
    return (
      <div className="dashboard-shell">
        <div className="dashboard-empty-state">
          <h2>No progress data available.</h2>
          <p>{error}</p>
          <p>
            Start with seeded demo data: <a href="/demo-user">Create demo user data</a>
          </p>
        </div>
      </div>
    );
  }

  const completionPercent = Math.min(
    100,
    Math.round((progress.totalQuizzesCompleted / yearlyQuizGoal) * 100)
  );
  const quizzesRemaining = Math.max(0, yearlyQuizGoal - progress.totalQuizzesCompleted);
  const topTopics = Object.entries(progress.topicScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([topic, score]) => ({
      topic,
      scorePercent: Math.round(score * 100),
    }));

  const chartTopics = Array.from(
    new Set(topicHistory.flatMap((point) => Object.keys(point.topicScores)))
  ).slice(0, 6);

  const chartSeries = chartTopics.map((topic) => {
    const points = topicHistory.map((point, index) => ({
      x: index,
      y: point.topicScores[topic] ?? 0,
    }));
    return { topic, points };
  });

  const chartWidth = 760;
  const chartHeight = 290;
  const padX = 56;
  const padY = 30;
  const innerWidth = chartWidth - padX * 2;
  const innerHeight = chartHeight - padY * 2;
  const lineColors = ['#0f766e', '#0ea5e9', '#f97316', '#ef4444', '#9333ea', '#16a34a'];

  const toChartPoint = (xIndex: number, yScore: number) => {
    const x = padX + (topicHistory.length <= 1 ? innerWidth / 2 : (xIndex / (topicHistory.length - 1)) * innerWidth);
    const y = padY + (1 - Math.max(0, Math.min(100, yScore)) / 100) * innerHeight;
    return `${x},${y}`;
  };

  const lastScore = topicHistory.length > 0 ? topicHistory[topicHistory.length - 1].totalScore : 0;

  const openImprovement = async () => {
    await loadHistoryData();
    setShowImprovementModal(true);
  };

  const openCompleted = async () => {
    await loadHistoryData();
    setShowCompletedModal(true);
  };

  const openReview = (sessionId: number) => {
    setShowCompletedModal(false);
    navigate(`/quiz?reviewSessionId=${sessionId}`);
  };

  return (
    <div className="dashboard-shell">
      <section className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Learning Dashboard</p>
          <h2>Your Cyber Literacy Journey</h2>
          <p>
            Track your growth, complete weekly challenges, and focus on the risk areas that matter most.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <a className="dashboard-action" href="/quiz">
            Start Weekly Quiz
          </a>
          <a className="dashboard-action secondary" href="/quiz?mode=monthly">
            Start Monthly Assessment
          </a>
        </div>
      </section>

      <section className="dashboard-kpis">
        <button className="kpi-card kpi-button" type="button" onClick={openCompleted}>
          <h3>Quizzes Completed</h3>
          <p className="kpi-value">{progress.totalQuizzesCompleted}</p>
          <span>Total completed sessions</span>
        </button>
        <div className="kpi-card">
          <h3>Average Score</h3>
          <p className="kpi-value">{progress.averageScore.toFixed(1)}%</p>
          <span>Across all submitted quizzes</span>
        </div>
        <button className="kpi-card kpi-button" type="button" onClick={openImprovement}>
          <h3>Improvement</h3>
          <p className="kpi-value">{progress.improvementPercentage.toFixed(1)}%</p>
          <span>Compared with your baseline</span>
        </button>
      </section>

      <section className="dashboard-grid">
        <article className="panel-card completion-panel">
          <h3>Quiz Completion</h3>
          <p className="panel-subtitle">Progress toward your {yearlyQuizGoal}-quiz annual target.</p>
          <div className="completion-bar-wrap">
            <div className="completion-bar">
              <div className="completion-bar-fill" style={{ width: `${completionPercent}%` }} />
            </div>
            <span>{completionPercent}%</span>
          </div>
          <p className="completion-meta">
            {quizzesRemaining > 0
              ? `${quizzesRemaining} more quizzes to hit your target.`
              : 'Target achieved. Keep momentum with advanced assessments.'}
          </p>
          <div className="completion-breakdown">
            <div>
              <strong>{progress.totalQuizzesCompleted}</strong>
              <span>Completed</span>
            </div>
            <div>
              <strong>{quizzesRemaining}</strong>
              <span>Remaining</span>
            </div>
            <div>
              <strong>{yearlyQuizGoal}</strong>
              <span>Goal</span>
            </div>
          </div>
        </article>

        <article className="panel-card">
          <h3>Top Topic Mastery</h3>
          <p className="panel-subtitle">Your strongest areas shown as radial progress.</p>
          {topTopics.length > 0 ? (
            <div className="radial-grid">
              {topTopics.map(({ topic, scorePercent }) => {
                const radius = 42;
                const circumference = 2 * Math.PI * radius;
                const dashOffset = circumference - (scorePercent / 100) * circumference;

                return (
                  <div key={topic} className="radial-card">
                    <svg width="112" height="112" viewBox="0 0 112 112" className="radial-svg">
                      <circle className="radial-track" cx="56" cy="56" r={radius} />
                      <circle
                        className="radial-progress"
                        cx="56"
                        cy="56"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                      />
                    </svg>
                    <div className="radial-value">{scorePercent}%</div>
                    <div className="radial-label">{topic.split('_').join(' ')}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="panel-subtitle">Complete a quiz to populate topic mastery.</p>
          )}
        </article>
      </section>

      {showImprovementModal && (
        <div className="overlay-backdrop" onClick={() => setShowImprovementModal(false)}>
          <div className="overlay-card" onClick={(event) => event.stopPropagation()}>
            <div className="overlay-header">
              <h3>Improvement by Topic</h3>
              <button type="button" className="overlay-close" onClick={() => setShowImprovementModal(false)}>
                Close
              </button>
            </div>
            {historyLoading ? (
              <p className="panel-subtitle">Loading history...</p>
            ) : topicHistory.length === 0 ? (
              <p className="panel-subtitle">No historical scores yet. Complete quizzes to build your trend line.</p>
            ) : (
              <>
                <svg className="trend-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Topic improvement chart">
                  <rect x="0" y="0" width={chartWidth} height={chartHeight} fill="#ffffff" />
                  {[0, 25, 50, 75, 100].map((tick) => {
                    const y = padY + (1 - tick / 100) * innerHeight;
                    return (
                      <g key={tick}>
                        <line x1={padX} y1={y} x2={chartWidth - padX} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                        <text x={padX - 10} y={y + 4} textAnchor="end" className="trend-axis-text">
                          {tick}
                        </text>
                      </g>
                    );
                  })}
                  {chartSeries.map((series, index) => (
                    <polyline
                      key={series.topic}
                      fill="none"
                      stroke={lineColors[index % lineColors.length]}
                      strokeWidth="2.5"
                      points={series.points.map((point) => toChartPoint(point.x, point.y)).join(' ')}
                    />
                  ))}
                </svg>
                <div className="trend-legend">
                  {chartSeries.map((series, index) => (
                    <span key={series.topic}>
                      <i style={{ backgroundColor: lineColors[index % lineColors.length] }} />
                      {series.topic.split('_').join(' ')}
                    </span>
                  ))}
                </div>
                <p className="overlay-final-score">Final score: <strong>{lastScore.toFixed(1)}%</strong></p>
              </>
            )}
          </div>
        </div>
      )}

      {showCompletedModal && (
        <div className="overlay-backdrop" onClick={() => setShowCompletedModal(false)}>
          <div className="overlay-card" onClick={(event) => event.stopPropagation()}>
            <div className="overlay-header">
              <h3>Completed Quizzes</h3>
              <button type="button" className="overlay-close" onClick={() => setShowCompletedModal(false)}>
                Close
              </button>
            </div>
            {historyLoading ? (
              <p className="panel-subtitle">Loading completed quizzes...</p>
            ) : quizHistory.length === 0 ? (
              <p className="panel-subtitle">No completed quizzes found yet.</p>
            ) : (
              <div className="completed-list">
                {quizHistory.map((session) => (
                  <button
                    key={session.sessionId}
                    className="completed-item"
                    type="button"
                    onClick={() => openReview(session.sessionId)}
                  >
                    <div>
                      <strong>{session.sessionType.toUpperCase()} quiz</strong>
                      <span>{new Date(session.completedAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <strong>{session.totalScore.toFixed(1)}%</strong>
                      <span>{session.questionCount} questions</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <section className="panel-card interests-panel">
        <h3>Customize Your Cybersecurity Interests</h3>
        <p className="panel-subtitle">Select the areas you want Cyber2U to emphasize.</p>
        <div className="interest-grid dashboard-interest-grid">
          {INTEREST_OPTIONS.map((topic) => (
            <label key={topic.key} className="interest-option dashboard-interest-option">
              <input
                type="checkbox"
                checked={interestTopics.includes(topic.key)}
                onChange={() => toggleTopic(topic.key)}
              />
              <span>{topic.label}</span>
            </label>
          ))}
        </div>
        <button className="dashboard-save-button" type="button" onClick={saveInterests} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Interest Areas'}
        </button>
        {saveMessage && <p className="dashboard-save-success">{saveMessage}</p>}
        {saveError && <p className="error">{saveError}</p>}
      </section>
    </div>
  );
};

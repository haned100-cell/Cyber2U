import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

interface Progress {
  totalQuizzesCompleted: number;
  averageScore: number;
  improvementPercentage: number;
  topicScores: Record<string, number>;
}

export const LearnerDashboard: React.FC = () => {
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

  useEffect(() => {
    const fetchProgress = async () => {
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

    fetchProgress();
  }, []);

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
      <div className="dashboard">
        <h2>No progress data available.</h2>
        <p>{error}</p>
        <p>
          Start with seeded demo data: <a href="/demo-user">Create demo user data</a>
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h2>Your Cyber Literacy Journey</h2>
      <div className="stats">
        <div className="stat-card">
          <h3>Quizzes Completed</h3>
          <p className="stat-value">{progress.totalQuizzesCompleted}</p>
        </div>
        <div className="stat-card">
          <h3>Average Score</h3>
          <p className="stat-value">{progress.averageScore.toFixed(1)}%</p>
        </div>
        <div className="stat-card">
          <h3>Improvement</h3>
          <p className="stat-value">{progress.improvementPercentage.toFixed(1)}%</p>
        </div>
      </div>
      <div className="topics">
        <h3>Topic Mastery</h3>
        {Object.entries(progress.topicScores).map(([topic, score]) => (
          <div key={topic} className="topic-bar">
            <span>{topic}</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${score * 100}%` }} />
            </div>
            <span>{(score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="topics interests-panel">
        <h3>Customize Your Cybersecurity Interests</h3>
        <p>Select the areas you want Cyber2U to emphasize.</p>
        <div className="interest-grid">
          {INTEREST_OPTIONS.map((topic) => (
            <label key={topic.key} className="interest-option">
              <input
                type="checkbox"
                checked={interestTopics.includes(topic.key)}
                onChange={() => toggleTopic(topic.key)}
              />
              <span>{topic.label}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={saveInterests} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Interest Areas'}
        </button>
        {saveMessage && <p>{saveMessage}</p>}
        {saveError && <p className="error">{saveError}</p>}
      </div>
    </div>
  );
};

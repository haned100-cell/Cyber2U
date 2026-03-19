import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Progress {
  totalQuizzesCompleted: number;
  averageScore: number;
  improvementPercentage: number;
  topicScores: Record<string, number>;
}

export const LearnerDashboard: React.FC = () => {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get('/api/progress', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProgress(response.data);
      } catch (err) {
        console.error('Failed to fetch progress:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!progress) return <div>No progress data available.</div>;

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
    </div>
  );
};

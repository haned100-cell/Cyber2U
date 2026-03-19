import React, { useState, useEffect } from 'react';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState({
    openRate: 0,
    clickThroughRate: 0,
    quizParticipation: 0,
    averageScore: 0,
  });

  useEffect(() => {
    // TODO: GET /api/analytics/summary
    console.log('Fetching analytics...');
    setMetrics((current) => ({ ...current }));
  }, []);

  return (
    <div className="analytics-dashboard">
      <h2>Campaign Analytics</h2>
      <div className="metrics">
        <div className="metric-card">
          <h3>Email Open Rate</h3>
          <p className="metric-value">{metrics.openRate}%</p>
        </div>
        <div className="metric-card">
          <h3>Click-Through Rate</h3>
          <p className="metric-value">{metrics.clickThroughRate}%</p>
        </div>
        <div className="metric-card">
          <h3>Quiz Participation</h3>
          <p className="metric-value">{metrics.quizParticipation}%</p>
        </div>
        <div className="metric-card">
          <h3>Average Score</h3>
          <p className="metric-value">{metrics.averageScore}%</p>
        </div>
      </div>
    </div>
  );
};

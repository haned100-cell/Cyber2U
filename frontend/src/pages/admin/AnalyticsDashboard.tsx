import React, { useState, useEffect } from 'react';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // TODO: GET /api/analytics/summary
    console.log('Fetching analytics...');
  }, []);

  return (
    <div className="analytics-dashboard">
      <h2>Campaign Analytics</h2>
      <div className="metrics">
        <div className="metric-card">
          <h3>Email Open Rate</h3>
          <p className="metric-value">0%</p>
        </div>
        <div className="metric-card">
          <h3>Click-Through Rate</h3>
          <p className="metric-value">0%</p>
        </div>
        <div className="metric-card">
          <h3>Quiz Participation</h3>
          <p className="metric-value">0%</p>
        </div>
        <div className="metric-card">
          <h3>Average Score</h3>
          <p className="metric-value">0%</p>
        </div>
      </div>
    </div>
  );
};

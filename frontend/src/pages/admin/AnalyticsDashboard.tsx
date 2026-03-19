import React, { useState, useEffect } from 'react';
import { api, AnalyticsSummary, QuarterlyReport } from '../../lib/api';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsSummary>({
    openRate: 0,
    clickThroughRate: 0,
    quizParticipation: 0,
    averageScore: 0,
    scoreImprovement: 0,
    listGrowth: 0,
    totalUsers: 0,
    totalCampaignsSent: 0,
  });
  const [report, setReport] = useState<QuarterlyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setError('');
      setLoading(true);

      try {
        const summary = await api.getAnalyticsSummary();
        setMetrics(summary);

        const now = new Date();
        const quarter = Math.floor((now.getUTCMonth() + 3) / 3);
        const quarterly = await api.getQuarterlyReport(now.getUTCFullYear(), quarter);
        setReport(quarterly);
      } catch (err) {
        console.error('Fetching analytics failed:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <h2>Campaign Analytics</h2>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <h2>Campaign Analytics</h2>
      {error && <p className="error">{error}</p>}
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
        <div className="metric-card">
          <h3>Score Improvement</h3>
          <p className="metric-value">{metrics.scoreImprovement}%</p>
        </div>
        <div className="metric-card">
          <h3>List Growth (30d vs previous 30d)</h3>
          <p className="metric-value">{metrics.listGrowth}%</p>
        </div>
        <div className="metric-card">
          <h3>Total Active Users</h3>
          <p className="metric-value">{metrics.totalUsers}</p>
        </div>
        <div className="metric-card">
          <h3>Total Campaigns Sent</h3>
          <p className="metric-value">{metrics.totalCampaignsSent}</p>
        </div>
      </div>

      {report && (
        <div className="metrics">
          <h3>
            Quarterly Report Q{report.period.quarter} {report.period.year}
          </h3>
          <div className="metric-card">
            <h4>Objective 1: Awareness & Engagement</h4>
            <p>Open Rate: {report.objective1.openRate}%</p>
            <p>CTR: {report.objective1.clickThroughRate}%</p>
            <p>List Growth (new users in quarter): {report.objective1.listGrowth}</p>
          </div>
          <div className="metric-card">
            <h4>Objective 2: Knowledge Improvement</h4>
            <p>Average Score: {report.objective2.averageScore}%</p>
            <p>Quiz Participation: {report.objective2.quizParticipation}%</p>
            <p>Score Improvement: {report.objective2.scoreImprovement}%</p>
          </div>
          <div className="metric-card">
            <h4>Objective 3: Campaign Impact</h4>
            <p>Campaigns Sent: {report.objective3.campaignsSent}</p>
            <p>Total Recipients: {report.objective3.totalRecipients}</p>
            <p>Average Open Rate: {report.objective3.averageOpenRate}%</p>
          </div>
        </div>
      )}
    </div>
  );
};

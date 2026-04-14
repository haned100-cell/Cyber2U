import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export const FeedbackForm: React.FC = () => {
  const navigate = useNavigate();
  const [journeyLabel, setJourneyLabel] = useState('Learner Journey');
  const [journeyVariant, setJourneyVariant] = useState('weekly-focused');
  const [usabilityRating, setUsabilityRating] = useState(4);
  const [contentClarityRating, setContentClarityRating] = useState(4);
  const [confidenceImprovementRating, setConfidenceImprovementRating] = useState(4);
  const [recommendationRating, setRecommendationRating] = useState(8);
  const [mostValuableFeature, setMostValuableFeature] = useState('The dashboard progress and topic-focused feedback made the learning path clear.');
  const [biggestPainPoint, setBiggestPainPoint] = useState('');
  const [suggestedImprovement, setSuggestedImprovement] = useState('');
  const [wouldContinue, setWouldContinue] = useState(true);
  const [screenshotsRaw, setScreenshotsRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const screenshots = screenshotsRaw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      await api.submitFeedback({
        journeyLabel,
        journeyVariant,
        usabilityRating,
        contentClarityRating,
        confidenceImprovementRating,
        recommendationRating,
        mostValuableFeature,
        biggestPainPoint,
        suggestedImprovement,
        wouldContinue,
        screenshots,
      });

      setSuccess('Feedback submitted. Thank you for helping improve Cyber2U.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not submit feedback response.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <section className="panel-card feedback-panel">
        <h2>Cyber2U Feedback Form</h2>
        <p className="panel-subtitle">
          Share your journey experience to support methodology and validation reporting.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Journey label
            <input value={journeyLabel} onChange={(event) => setJourneyLabel(event.target.value)} required />
          </label>

          <label>
            Journey variant
            <select value={journeyVariant} onChange={(event) => setJourneyVariant(event.target.value)}>
              <option value="weekly-focused">Weekly-focused</option>
              <option value="monthly-focused">Monthly-focused</option>
              <option value="interest-customization">Interest customization</option>
              <option value="mixed-flow">Mixed flow</option>
            </select>
          </label>

          <label>
            Usability rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={usabilityRating}
              onChange={(event) => setUsabilityRating(Number(event.target.value))}
              required
            />
          </label>

          <label>
            Content clarity rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={contentClarityRating}
              onChange={(event) => setContentClarityRating(Number(event.target.value))}
              required
            />
          </label>

          <label>
            Confidence improvement rating (1-5)
            <input
              type="number"
              min={1}
              max={5}
              value={confidenceImprovementRating}
              onChange={(event) => setConfidenceImprovementRating(Number(event.target.value))}
              required
            />
          </label>

          <label>
            Recommendation score (0-10)
            <input
              type="number"
              min={0}
              max={10}
              value={recommendationRating}
              onChange={(event) => setRecommendationRating(Number(event.target.value))}
              required
            />
          </label>

          <label>
            Most valuable feature
            <textarea
              value={mostValuableFeature}
              onChange={(event) => setMostValuableFeature(event.target.value)}
              rows={3}
              required
            />
          </label>

          <label>
            Biggest pain point
            <textarea
              value={biggestPainPoint}
              onChange={(event) => setBiggestPainPoint(event.target.value)}
              rows={3}
            />
          </label>

          <label>
            Suggested improvement
            <textarea
              value={suggestedImprovement}
              onChange={(event) => setSuggestedImprovement(event.target.value)}
              rows={3}
            />
          </label>

          <label className="feedback-toggle">
            <input
              type="checkbox"
              checked={wouldContinue}
              onChange={(event) => setWouldContinue(event.target.checked)}
            />
            <span>I would continue using Cyber2U for future learning</span>
          </label>

          <label>
            Screenshot paths (optional, one per line)
            <textarea
              value={screenshotsRaw}
              onChange={(event) => setScreenshotsRaw(event.target.value)}
              rows={4}
              placeholder="docs/screenshots/study/user_01-dashboard.png"
            />
          </label>

          <div className="feedback-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </form>

        {error && <p className="error">{error}</p>}
        {success && <p className="dashboard-save-success">{success}</p>}
      </section>
    </div>
  );
};

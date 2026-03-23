import React, { useState } from 'react';
import { api } from '../lib/api';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await api.requestMagicLink(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send login link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Check Your Email</h2>
          <p>We've sent a magic login link to:</p>
          <p className="email-highlight"><strong>{email}</strong></p>
          <p>Click the link in the email to log in to your account.</p>
          <button 
            type="button"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
            className="back-button"
          >
            ← Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login to Cyber2You</h2>
        <p>Enter your email to receive a magic login link.</p>
        <p className="subtitle">No password needed. We'll send you a secure link to log in.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </form>
        <p className="info-text">
          <strong>Tip:</strong> This works for both new and returning users.
        </p>
      </div>
    </div>
  );
};

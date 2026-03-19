import React, { useState } from 'react';
import axios from 'axios';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await axios.post('/api/auth/request-magic-link', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up');
    }
  };

  if (submitted) {
    return (
      <div className="signup-container">
        <h2>Check Your Email</h2>
        <p>We've sent a magic link to <strong>{email}</strong></p>
        <p>Click the link to verify and complete signup.</p>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <h2>Join Cyber2You</h2>
      <p>Learn cybersecurity through interactive emails and quizzes.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        <button type="submit">Get Started</button>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  );
};

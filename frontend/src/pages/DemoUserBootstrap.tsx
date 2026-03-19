import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const DemoUserBootstrap: React.FC = () => {
  const [message, setMessage] = useState('Bootstrapping demo user and sample quiz progress...');
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const result = await api.bootstrapDemoUser();
        localStorage.setItem('authToken', result.token);
        setMessage(`Demo user ready (${result.email}), redirecting to dashboard...`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } catch (err) {
        console.error('Demo bootstrap failed:', err);
        setError('Could not create demo user data. Please try again.');
      }
    };

    run();
  }, []);

  return (
    <div className="dashboard">
      <h2>Demo User Setup</h2>
      <p>{message}</p>
      {error && (
        <>
          <p className="error">{error}</p>
          <a href="/">Back to signup</a>
        </>
      )}
    </div>
  );
};

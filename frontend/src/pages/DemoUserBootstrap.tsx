import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

export const DemoUserBootstrap: React.FC = () => {
  const [message, setMessage] = useState('Bootstrapping demo user and sample quiz progress...');
  const [error, setError] = useState('');
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const run = async () => {
      try {
        setError('');
        const result = await api.bootstrapDemoUser();
        localStorage.setItem('authToken', result.token);
        setMessage(`Demo user ready (${result.email}), redirecting to dashboard...`);
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 800);
      } catch (err: any) {
        console.error('Demo bootstrap failed:', err);
        setError(err?.response?.data?.error || 'Could not create demo user data. Please try again.');
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

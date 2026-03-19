import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No verification token found.');
        return;
      }

      try {
        const result = await api.verifyMagicLink(token);
        setStatus('success');
        setMessage(`Welcome ${result.email}! Redirecting to dashboard...`);

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.error || 'Verification failed. Token may have expired.'
        );
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="verify-container">
      {status === 'loading' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <div className="success">
          <h2>✓ Email Verified!</h2>
          <p>{message}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="error">
          <h2>✗ Verification Failed</h2>
          <p>{message}</p>
          <a href="/">Try signing up again</a>
        </div>
      )}
    </div>
  );
};

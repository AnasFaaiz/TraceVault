'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';
import styles from '@/app/auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('If an account with that email exists, a password reset link has been sent.');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="login">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">Email Address</label>
          <div className={styles.inputWrapper}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className={styles.input}
            />
          </div>
        </div>

        {message && <p className={styles.passwordNote}>{message}</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Link href="/login" className={styles.footerLink}>Back to Login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

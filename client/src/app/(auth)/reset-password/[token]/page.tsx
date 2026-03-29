'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import AuthLayout from '@/components/auth/AuthLayout';
import styles from '@/app/auth.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.post('/auth/reset-password', { token, password });
      setMessage('Your password has been reset successfully. You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message ||
          'Invalid or expired token. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout type="login">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">New Password</label>
          <div className={styles.inputWrapper}>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={styles.input}
            />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirmPassword">Confirm New Password</label>
          <div className={styles.inputWrapper}>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className={styles.input}
            />
          </div>
        </div>

        {message && <p className={styles.passwordNote}>{message}</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <Link href="/login" className={styles.footerLink}>Back to Login</Link>
        </div>
      </form>
    </AuthLayout>
  );
}

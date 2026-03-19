"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AuthLayout from '@/components/auth/AuthLayout';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from '@/app/auth.module.css';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth, token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && token) {
      router.push('/feed');
    }
  }, [_hasHydrated, token, router]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      router.push('/feed');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout type="login">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {error && (
          <div className={styles.errorText} style={{ textAlign: 'center', marginBottom: '16px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
            {error}
          </div>
        )}
        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('email')}
              type="email"
              placeholder="name@company.com"
              className={styles.input}
            />
          </div>
          {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className={styles.label}>Password</label>
            <a href="#" className={styles.footerLink} style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forgot?</a>
          </div>
          <div className={styles.inputWrapper}>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className={styles.input}
            />
          </div>
          {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
        </div>

        <button
          disabled={isLoading}
          type="submit"
          className={styles.submitBtn}
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In to Vault'}
        </button>
      </form>
    </AuthLayout>
  );
}

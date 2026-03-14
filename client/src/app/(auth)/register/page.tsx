"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AuthLayout from '@/components/auth/AuthLayout';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import styles from '@/app/auth.module.css';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Register
      await api.post('/auth/register', data);

      // 2. Auto-login after successful registration
      const loginResponse = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      const { user, accessToken } = loginResponse.data;
      setAuth(user, accessToken);
      router.push('/dashboard');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout type="register">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {error && (
          <div className={styles.errorText} style={{ textAlign: 'center', marginBottom: '16px', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '6px' }}>
            {error}
          </div>
        )}
        <div className={styles.formGroup}>
          <label className={styles.label}>Full Name</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('name')}
              type="text"
              placeholder="Engineer Name"
              className={styles.input}
            />
          </div>
          {errors.name && <p className={styles.errorText}>{errors.name.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Email Address</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('email')}
              type="email"
              placeholder="name@vault.io"
              className={styles.input}
            />
          </div>
          {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Security Password</label>
          <div className={styles.inputWrapper}>
            <input
              {...register('password')}
              type="password"
              placeholder="Min. 8 characters"
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
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Create Your Vault'}
        </button>
      </form>
    </AuthLayout>
  );
}

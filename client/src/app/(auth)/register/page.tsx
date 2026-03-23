"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import AuthLayout from '@/components/auth/AuthLayout';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from '@/app/auth.module.css';
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.password) return;

  if (!data.confirmPassword || data.confirmPassword.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Please confirm your password',
    });
    return;
  }

  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function getPasswordStrength(password: string): {
  score: number;
  label: 'Weak' | 'Fair' | 'Strong';
  className: string;
  activeSegments: number;
} {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { score, label: 'Weak', className: styles.strengthWeak, activeSegments: password.length > 0 ? 1 : 0 };
  }
  if (score <= 3) {
    return { score, label: 'Fair', className: styles.strengthFair, activeSegments: 2 };
  }
  return { score, label: 'Strong', className: styles.strengthStrong, activeSegments: 3 };
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { setAuth, token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && token) {
      router.push('/feed');
    }
  }, [_hasHydrated, token, router]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch('password', '');
  const confirmPasswordValue = (watch('confirmPassword') ?? '') as string;
  const strength = getPasswordStrength(passwordValue);

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
      router.push('/feed');
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
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className={`${styles.input} ${styles.passwordInput}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordValue.length > 0 && (
            <>
              <div className={styles.strengthMeter} aria-hidden="true">
                <span className={`${styles.strengthSegment} ${styles.segmentWeak} ${strength.activeSegments >= 1 ? styles.segmentActive : ''}`} />
                <span className={`${styles.strengthSegment} ${styles.segmentFair} ${strength.activeSegments >= 2 ? styles.segmentActive : ''}`} />
                <span className={`${styles.strengthSegment} ${styles.segmentStrong} ${strength.activeSegments >= 3 ? styles.segmentActive : ''}`} />
              </div>
              <p className={styles.passwordNote}>
                Strength:
                <span className={`${styles.strengthBadge} ${strength.className}`}>{strength.label}</span>
                Compare by aiming for 8+ chars, upper/lowercase, a number, and a symbol.
              </p>
            </>
          )}
          {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
        </div>

        {passwordValue.length > 0 && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Confirm Password</label>
            <div className={styles.inputWrapper}>
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter password"
                className={`${styles.input} ${styles.passwordInput}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPasswordValue.length > 0 && passwordValue === confirmPasswordValue && (
              <p className={`${styles.passwordNote} ${styles.matchSuccess}`}>✓ Passwords match.</p>
            )}
            {confirmPasswordValue.length > 0 && passwordValue !== confirmPasswordValue && (
              <p className={`${styles.passwordNote} ${styles.matchError}`}>Passwords do not match.</p>
            )}
            {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword.message}</p>}
          </div>
        )}

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

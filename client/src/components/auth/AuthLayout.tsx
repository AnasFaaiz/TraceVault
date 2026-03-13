"use client";

import Link from 'next/link';
import { Terminal, ArrowRight } from 'lucide-react';
import styles from '@/app/auth.module.css';

interface AuthLayoutProps {
  children: React.ReactNode;
  type: 'login' | 'register';
}

export default function AuthLayout({ children, type }: AuthLayoutProps) {
  return (
    <div className={styles.authRoot}>
      <div className={styles.authCard}>
        <Link href="/" className={styles.logoArea}>
          <div className={styles.iconBox}>
            <Terminal size={18} />
          </div>
          <span className={styles.logoText}>TraceVault</span>
        </Link>
        
        <h2 className={styles.title}>
          {type === 'login' ? 'Welcome Back' : 'Create Vault'}
        </h2>
        <p className={styles.subtitle}>
          {type === 'login' 
            ? 'Access your engineering reflection legacy.' 
            : 'Start documenting your engineering growth.'}
        </p>

        {children}

        <div className={styles.footer}>
          <p className={styles.footerText}>
            {type === 'login' ? (
              <>
                New to TraceVault?{' '}
                <Link href="/register" className={styles.footerLink}>
                  Join the project <ArrowRight size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className={styles.footerLink}>
                  Sign in <ArrowRight size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

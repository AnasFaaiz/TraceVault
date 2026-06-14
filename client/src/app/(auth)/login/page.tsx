"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AuthLayout from "@/components/auth/AuthLayout";
import { Eye, EyeOff, ShieldCheck, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "@/app/auth.module.css";
import api from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const mfaSchema = z.object({
  code: z.string().length(6, "Verification code must be exactly 6 digits"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type MfaFormValues = z.infer<typeof mfaSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Multi-Factor Intercept States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSessionToken, setMfaSessionToken] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email">("totp");

  const { setAuth, token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && token) {
      router.push("/feed");
    }
  }, [_hasHydrated, token, router]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const mfaForm = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
  });

  // Step 1: Submit email & password credentials
  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/login", data);

      // If backend signals that MFA challenge validation is required
      if (response.data?.requiresMFA) {
        setMfaRequired(true);
        setMfaSessionToken(response.data.mfaSessionToken);
        setMfaMethod(
          response.data.supportedMethods?.includes("totp") ? "totp" : "email",
        );
        return;
      }

      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      router.push("/feed");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Submit the 6-digit confirmation token
  const onMfaSubmit = async (data: MfaFormValues) => {
    if (!mfaSessionToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/verify-mfa", {
        mfaSessionToken,
        code: data.code,
        method: mfaMethod,
      });

      const { user, accessToken } = response.data;
      setAuth(user, accessToken);
      router.push("/feed");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Invalid or expired validation code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Switch challenge over to email dynamic tokens
  const triggerEmailFallback = async () => {
    if (!mfaSessionToken) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.post("/auth/mfa-email-otp", { mfaSessionToken });
      setMfaMethod("email");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to dispatch email safety token.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout type="login">
      {!mfaRequired ? (
        /* STANDARD SIGN IN VIEW */
        <form
          onSubmit={loginForm.handleSubmit(onLoginSubmit)}
          className={styles.form}
        >
          {error && (
            <div
              className={styles.errorText}
              style={{ textAlign: "center", marginBottom: "16px" }}
            >
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <input
                {...loginForm.register("email")}
                type="email"
                placeholder="name@company.com"
                className={styles.input}
              />
            </div>
            {loginForm.formState.errors.email && (
              <p className={styles.errorText}>
                {loginForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className={styles.formGroup}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label className={styles.label}>Password</label>
              <Link
                href="/forgot-password"
                className={styles.footerLink}
                style={{
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Forgot?
              </Link>
            </div>
            <div className={styles.inputWrapper}>
              <input
                {...loginForm.register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`${styles.input} ${styles.passwordInput}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {loginForm.formState.errors.password && (
              <p className={styles.errorText}>
                {loginForm.formState.errors.password.message}
              </p>
            )}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className={styles.submitBtn}
          >
            {isLoading ? (
              <div className={styles.loaderContainer}>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRing}></div>
              </div>
            ) : (
              "Sign In to Vault"
            )}
          </button>
        </form>
      ) : (
        /* DYNAMIC MFA INTERCEPT VIEW */
        <form
          onSubmit={mfaForm.handleSubmit(onMfaSubmit)}
          className={styles.form}
        >
          <div className={styles.mfaContainer}>
            <div className={styles.mfaIconWrapper}>
              {mfaMethod === "totp" ? (
                <ShieldCheck size={20} strokeWidth={1.5} />
              ) : (
                <Mail size={20} strokeWidth={1.5} />
              )}
            </div>
            <p className={styles.mfaSubtitle}>
              {mfaMethod === "totp"
                ? "Enter the 6-digit confirmation key via your security authenticator application."
                : "A temporary dynamic verification token was dispatched to your registered email."}
            </p>
          </div>

          {error && (
            <div
              className={styles.errorText}
              style={{ textAlign: "center", marginBottom: "16px" }}
            >
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label}>Verification Token</label>
            <div className={styles.inputWrapper}>
              <input
                {...mfaForm.register("code")}
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                className={`${styles.input} ${styles.mfaInput}`}
              />
            </div>
            {mfaForm.formState.errors.code && (
              <p className={styles.errorText}>
                {mfaForm.formState.errors.code.message}
              </p>
            )}
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className={styles.submitBtn}
          >
            {isLoading ? (
              <div className={styles.loaderContainer}>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRing}></div>
                <div className={styles.loaderRing}></div>
              </div>
            ) : (
              "Verify Checkpoint"
            )}
          </button>

          {mfaMethod === "totp" && (
            <button
              type="button"
              onClick={triggerEmailFallback}
              className={styles.fallbackBtn}
            >
              Lost app access? Request a secure email fallback code
            </button>
          )}
        </form>
      )}
    </AuthLayout>
  );
}

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

// Validation schemas
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

  // Multi-Factor Authentication Intercept States
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaSessionToken, setMfaSessionToken] = useState<string | null>(null);
  const [mfaMethod, setMfaMethod] = useState<"totp" | "email">("email");
  const [availableMethods, setAvailableMethods] = useState<string[]>(["email"]);

  const { setAuth, token, _hasHydrated } = useAuthStore();
  const router = useRouter();

  // Redirect if user is already authenticated
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

      // Handle MFA Interception
      if (response.data?.requiresMFA) {
        const sessionToken = response.data.mfaSessionToken;
        const methods = response.data.supportedMethods || ["email"];

        // Default to 'totp' if available, otherwise fall back to 'email'
        const defaultMethod = methods.includes("totp") ? "totp" : "email";

        setMfaRequired(true);
        setMfaSessionToken(sessionToken);
        setAvailableMethods(methods);
        setMfaMethod(defaultMethod);

        // If the targeted method is Email OTP, trigger the delivery API immediately
        if (defaultMethod === "email") {
          await api.post("/auth/mfa-email-otp", {
            mfaSessionToken: sessionToken,
          });
        }
        return;
      }

      // Standard Login Flow (MFA bypassed or device trusted)
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

  // Step 2: Submit the 6-digit confirmation token (MFA Checkpoint verification)
  const onMfaSubmit = async (data: MfaFormValues) => {
    if (!mfaSessionToken) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post("/auth/verify-mfa-challenge", {
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

  // Switch challenge over to email dynamic tokens or execute a Resend trigger
  const handleMethodChange = async (method: "totp" | "email") => {
    if (!mfaSessionToken) return;
    setMfaMethod(method);
    setError(null);
    mfaForm.reset();

    // Trigger explicit email dispatch if transitioning or resending
    if (method === "email") {
      setIsLoading(true);
      try {
        await api.post("/auth/mfa-email-otp", { mfaSessionToken });
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            "Failed to dispatch email verification code.",
        );
      } finally {
        setIsLoading(false);
      }
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
          {/* Choice Selection Tabs (Only displayed if multiple methods are accessible) */}
          {availableMethods.length > 1 && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginBottom: "20px",
                background: "#1b1b1f",
                padding: "4px",
                borderRadius: "6px",
              }}
            >
              <button
                type="button"
                onClick={() => handleMethodChange("totp")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: "none",
                  background: mfaMethod === "totp" ? "#27272a" : "transparent",
                  color: mfaMethod === "totp" ? "#ffffff" : "#a1a1aa",
                  transition: "all 0.2s ease",
                }}
              >
                Authenticator App
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange("email")}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  cursor: "pointer",
                  border: "none",
                  background: mfaMethod === "email" ? "#27272a" : "transparent",
                  color: mfaMethod === "email" ? "#ffffff" : "#a1a1aa",
                  transition: "all 0.2s ease",
                }}
              >
                Email Code
              </button>
            </div>
          )}

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
            <label className={styles.label}>
              {mfaMethod === "totp"
                ? "Authenticator Code"
                : "Verification Token"}
            </label>
            <div className={styles.inputWrapper}>
              <input
                {...mfaForm.register("code")}
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="000000"
                className={`${styles.input} ${styles.mfaInput}`}
                style={{
                  textAlign: "center",
                  letterSpacing: "0.25em",
                  fontSize: "18px",
                }}
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

          <button
            type="button"
            onClick={() => handleMethodChange("email")}
            className={styles.fallbackBtn}
            disabled={isLoading}
            style={{
              marginTop: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            {mfaMethod === "totp"
              ? "Lost app access? Request a secure email fallback code"
              : "Didn't receive a code? Click here to resend email token"}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}

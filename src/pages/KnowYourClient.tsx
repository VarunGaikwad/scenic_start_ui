import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { checkEmailExists, loginUser, registerUser } from "@/api";
import { setDataToLocalStorage } from "@/utils";
import { STORAGE_KEYS } from "@/constants";

type Values = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type StepKey = keyof Values;

interface Step {
  key: StepKey;
  text: string;
  emoji: string;
  placeholder: string;
  description?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Validation utilities
const validators = {
  name: (name: string): string | null => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return "Name must be at least 2 characters.";
    if (trimmed.length > 50) return "Name is too long (max 50 characters).";
    if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes.";
    }
    return null;
  },

  email: (email: string): string | null => {
    if (!EMAIL_REGEX.test(email)) {
      return "Please enter a valid email address.";
    }
    return null;
  },

  password: (password: string, isNewUser: boolean): string | null => {
    if (password.length < 8) return "Password must be at least 8 characters.";

    if (isNewUser) {
      if (!/[A-Z]/.test(password))
        return "Password must contain an uppercase letter.";
      if (!/[a-z]/.test(password))
        return "Password must contain a lowercase letter.";
      if (!/[0-9]/.test(password)) return "Password must contain a number.";
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return "Password must contain a special character.";
      }
    }

    return null;
  },

  confirmPassword: (
    password: string,
    confirmPassword: string,
  ): string | null => {
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  },
};

// Password strength calculator
function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  if (score <= 2) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score: 2, label: "Fair", color: "bg-yellow-500" };
  if (score <= 5) return { score: 3, label: "Good", color: "bg-blue-500" };
  return { score: 4, label: "Strong", color: "bg-green-500" };
}

export default function KnowYourClient() {
  const [step, setStep] = useState(0);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const inputRef = useRef<HTMLInputElement>(null);

  const steps = useMemo<Step[]>(
    () => [
      {
        key: "name",
        text: "Let's start with your name",
        emoji: "👋",
        placeholder: "Enter your full name",
        description: "We'd love to know what to call you",
      },
      {
        key: "email",
        text: "What's your email?",
        emoji: "📧",
        placeholder: "you@example.com",
        description: "We'll use this to sign you in",
      },
      ...(emailExists === true
        ? [
            {
              key: "password" as const,
              text: "Welcome back!",
              emoji: "🎉",
              placeholder: "Enter your password",
              description: "Enter your password to continue",
            },
          ]
        : emailExists === false
          ? [
              {
                key: "password" as const,
                text: "Create a secure password",
                emoji: "🔒",
                placeholder: "Min. 8 characters",
                description: "Choose a strong password to protect your account",
              },
              {
                key: "confirmPassword" as const,
                text: "Confirm your password",
                emoji: "✓",
                placeholder: "Re-enter your password",
                description: "Just to make sure we got it right",
              },
            ]
          : []),
    ],
    [emailExists],
  );

  useEffect(() => {
    inputRef.current?.focus();
    setShowPassword(false);
    setError(null);
  }, [step]);

  const current = steps[step];
  if (!current) return null;

  const isPassword =
    current.key === "password" || current.key === "confirmPassword";
  const passwordStrength =
    current.key === "password" && !emailExists
      ? getPasswordStrength(values.password)
      : null;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        current.key === "email"
          ? e.target.value.toLowerCase().trim()
          : e.target.value;

      setValues((prev) => ({ ...prev, [current.key]: value }));
      setError(null); // Clear error on input
    },
    [current.key],
  );

  const goBack = useCallback(() => {
    if (step === 0 || loading) return;

    const previousStep = steps[step - 1];
    if (previousStep?.key === "email") {
      setEmailExists(null);
    }

    setStep(step - 1);
  }, [step, steps, loading]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (emailExists) {
        await loginUser(values.email, values.password);
      } else {
        await registerUser(values.name.trim(), values.email, values.password);
        await loginUser(values.email, values.password);
      }

      setValues({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      // window.location.reload();
    } catch (error: any) {
      console.error("Authentication error:", error);

      if (error.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (error.response?.status === 409) {
        setError("An account with this email already exists.");
      } else if (error.response?.status === 429) {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (!navigator.onLine) {
        setError("No internet connection. Please check your network.");
      } else {
        setError(
          error.response?.data?.message ||
            "Something went wrong. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (loading) return;
    setError(null);

    const value = values[current.key].trim();

    // Required field check
    if (!value) {
      return setError("This field is required.");
    }

    // Validate based on current step
    switch (current.key) {
      case "name": {
        const nameError = validators.name(values.name);
        if (nameError) return setError(nameError);

        setDataToLocalStorage(STORAGE_KEYS.USER_NAME, values.name.trim());
        setStep(step + 1);
        break;
      }

      case "email": {
        const emailError = validators.email(values.email);
        if (emailError) return setError(emailError);

        setLoading(true);
        try {
          const { data } = await checkEmailExists(values.email);
          setEmailExists(data.exists);
          setDataToLocalStorage(STORAGE_KEYS.USER_EMAIL, values.email);
          setStep(step + 1);
        } catch (error: any) {
          if (error.response?.status === 429) {
            setError("Too many requests. Please try again in a moment.");
          } else if (!navigator.onLine) {
            setError("No internet connection. Please check your network.");
          } else {
            setError("Unable to verify email. Please try again.");
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      case "password": {
        const passwordError = validators.password(
          values.password,
          !emailExists,
        );
        if (passwordError) return setError(passwordError);

        if (step < steps.length - 1) {
          setStep(step + 1);
        } else {
          await handleSubmit();
        }
        break;
      }

      case "confirmPassword": {
        const confirmError = validators.confirmPassword(
          values.password,
          values.confirmPassword,
        );
        if (confirmError) return setError(confirmError);

        await handleSubmit();
        break;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      handleNext();
    } else if (e.key === "Escape" && step > 0 && !loading) {
      e.preventDefault();
      goBack();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 font-inter text-white selection:bg-white/30">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md p-6 mx-4">
        {/* Glass Card */}
        <div className="backdrop-blur-2xl bg-white/5 border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10 flex flex-col items-center transition-all duration-500">
          {/* Header */}
          <div className="text-center mb-10 space-y-3">
            <div className="text-6xl mb-3 animate-in zoom-in duration-500">
              {current.emoji}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white animate-in fade-in slide-in-from-bottom-3 duration-500">
              {current.text}
            </h1>
            {current.description && (
              <p
                className="text-sm text-white/50 animate-in fade-in slide-in-from-bottom-3 duration-500"
                style={{ animationDelay: "100ms" }}
              >
                {current.description}
              </p>
            )}
            <div
              className="h-1 w-16 bg-linear-to-r from-blue-500 to-purple-500 rounded-full mx-auto animate-in fade-in duration-500"
              style={{ animationDelay: "200ms" }}
            />
          </div>

          {/* Form */}
          <div className="w-full space-y-5">
            {/* Input Field */}
            <div
              className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "300ms" }}
            >
              <input
                ref={inputRef}
                type={isPassword && !showPassword ? "password" : "text"}
                placeholder={current.placeholder}
                value={values[current.key]}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoComplete={
                  current.key === "email"
                    ? "email"
                    : current.key === "name"
                      ? "name"
                      : "off"
                }
                autoFocus
                aria-label={current.text}
                aria-invalid={!!error}
                aria-describedby={error ? "error-message" : undefined}
                className={`w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-lg placeholder:text-white/30 text-white outline-none focus:bg-white/10 focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all duration-300 ${
                  isPassword ? "pr-14" : ""
                } ${loading ? "opacity-50 cursor-not-allowed" : ""} ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/20" : ""}`}
              />

              {/* Password Toggle */}
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1 disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>

            {/* Password Strength Indicator */}
            {passwordStrength && values.password.length > 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        level <= passwordStrength.score
                          ? passwordStrength.color
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <p
                  className={`text-xs text-center transition-colors ${
                    passwordStrength.score >= 3
                      ? "text-green-400"
                      : passwordStrength.score >= 2
                        ? "text-yellow-400"
                        : "text-red-400"
                  }`}
                >
                  Password strength: {passwordStrength.label}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                id="error-message"
                role="alert"
                className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-sm animate-in fade-in slide-in-from-top-2 duration-300"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div
              className="flex items-center gap-3 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: "400ms" }}
            >
              {step > 0 && (
                <button
                  onClick={goBack}
                  disabled={loading}
                  aria-label="Go back"
                  className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                  title="Go Back (Esc)"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold h-14 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Please wait...</span>
                  </>
                ) : step === steps.length - 1 ? (
                  <>
                    <Check size={18} />
                    <span>{emailExists ? "Sign In" : "Create Account"}</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div
          className="mt-8 flex justify-center gap-2 animate-in fade-in duration-500"
          style={{ animationDelay: "500ms" }}
        >
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step
                  ? "w-8 bg-linear-to-r from-blue-500 to-purple-500"
                  : i < step
                    ? "w-1.5 bg-white/40"
                    : "w-1.5 bg-white/10"
              }`}
              aria-label={`Step ${i + 1}${i === step ? " (current)" : i < step ? " (completed)" : ""}`}
            />
          ))}
        </div>

        {/* Helper Text */}
        <p
          className="mt-6 text-center text-xs text-white/40 animate-in fade-in duration-500"
          style={{ animationDelay: "600ms" }}
        >
          Press{" "}
          <kbd className="px-2 py-1 bg-white/10 rounded text-white/60">
            Enter
          </kbd>{" "}
          to continue
          {step > 0 && (
            <>
              {" "}
              or{" "}
              <kbd className="px-2 py-1 bg-white/10 rounded text-white/60">
                Esc
              </kbd>{" "}
              to go back
            </>
          )}
        </p>
      </div>
    </div>
  );
}

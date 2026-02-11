import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { checkEmailExists, loginUser, registerUser } from "@/api";
import { setDataToLocalStorage } from "@/utils";

type Values = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

import { STORAGE_KEYS } from "@/constants";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))
    return "Password must contain an uppercase letter.";
  if (!/[a-z]/.test(password))
    return "Password must contain a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must contain a number.";
  return null;
}

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Name must be at least 2 characters.";
  if (trimmed.length > 50) return "Name is too long.";
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return "Name can only contain letters, spaces, hyphens, and apostrophes.";
  }
  return null;
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

  const steps = useMemo(
    () => [
      {
        key: "name" as const,
        text: "Let's start with your name",
        emoji: "🙂",
        placeholder: "Your name",
      },
      {
        key: "email" as const,
        text: "What's your email",
        emoji: "📮",
        placeholder: "you@example.com",
      },
      ...(emailExists === true
        ? [
            {
              key: "password" as const,
              text: "Welcome back!",
              emoji: "👋",
              placeholder: "Enter your password",
            },
          ]
        : emailExists === false
          ? [
              {
                key: "password" as const,
                text: "Create a password",
                emoji: "🛡️",
                placeholder: "At least 8 characters",
              },
              {
                key: "confirmPassword" as const,
                text: "One more time",
                emoji: "😄",
                placeholder: "Repeat password",
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      current.key === "email" ? e.target.value.toLowerCase() : e.target.value;
    setValues((v) => ({ ...v, [current.key]: value }));
  };

  const goBack = useCallback(() => {
    if (step === 0) return;

    const previousStep = steps[step - 1];
    if (previousStep?.key === "email") {
      setEmailExists(null);
    }

    setStep(step - 1);
  }, [step, steps]);

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (emailExists) {
        const { data } = await loginUser(values.email, values.password);
        setDataToLocalStorage(STORAGE_KEYS.AUTH_TOKEN, data.token);
        setDataToLocalStorage(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now());
      } else {
        await registerUser(values.name, values.email, values.password);
        const { data } = await loginUser(values.email, values.password);
        setDataToLocalStorage(STORAGE_KEYS.AUTH_TOKEN, data.token);
        setDataToLocalStorage(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now());
      }

      // Clear sensitive data
      setValues({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      window.location.reload();
    } catch (error: any) {
      console.error("Auth error:", error);

      if (error.response?.status === 401) {
        setError("Invalid credentials. Please try again.");
      } else if (error.response?.status === 429) {
        setError("Too many attempts. Please try again later.");
      } else if (!navigator.onLine) {
        setError("No internet connection.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    if (loading) return;
    setError(null);

    const value = values[current.key as keyof Values].trim();
    if (!value) return setError("This field is required.");

    // Name validation
    if (current.key === "name") {
      const nameError = validateName(values.name);
      if (nameError) return setError(nameError);

      setDataToLocalStorage(STORAGE_KEYS.USER_NAME, values.name.trim());
      setStep(step + 1);
      return;
    }

    // Email validation
    if (current.key === "email") {
      const email = values.email.trim().toLowerCase();

      if (!EMAIL_REGEX.test(email)) {
        return setError("Please enter a valid email address.");
      }

      setLoading(true);
      try {
        const { data } = await checkEmailExists(email);
        setEmailExists(data.exists);
        setDataToLocalStorage(STORAGE_KEYS.USER_EMAIL, email);
        setStep(step + 1);
      } catch (error: any) {
        if (error.response?.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else if (!navigator.onLine) {
          setError("No internet connection.");
        } else {
          setError("Unable to verify email. Please try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Password validation
    if (current.key === "password") {
      if (!emailExists) {
        // Only validate strength for new passwords
        const passwordError = validatePassword(values.password);
        if (passwordError) return setError(passwordError);
      } else {
        // Just check length for login
        if (values.password.length < 8) {
          return setError("Password must be at least 8 characters.");
        }
      }
    }

    // Confirm password validation
    if (current.key === "confirmPassword") {
      if (values.password !== values.confirmPassword) {
        return setError("Passwords do not match.");
      }
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      await submit();
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault();
      next();
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0a] font-inter text-white selection:bg-white/30">
      {/* Background Gradient / Image Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black/40" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-black/40 border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10 flex flex-col items-center">
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="text-4xl mb-2">{current.emoji}</div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">
              {current.text}
            </h1>
            <div className="h-1 w-12 bg-white/20 rounded-full mx-auto" />
          </div>

          <div className="w-full space-y-6">
            <div className="relative group">
              <input
                ref={inputRef}
                type={isPassword && !showPassword ? "password" : "text"}
                placeholder={current.placeholder}
                value={values[current.key as keyof Values]}
                onChange={onChange}
                onKeyDown={onKeyDown}
                disabled={loading}
                autoComplete="off"
                autoFocus
                className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-center text-lg placeholder:text-white/20 text-white outline-none focus:bg-white/10 focus:border-white/20 transition-all duration-300 ${
                  isPassword ? "pr-12" : ""
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              />

              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              {step > 0 && (
                <button
                  onClick={goBack}
                  disabled={loading}
                  className="p-4 rounded-xl hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                  title="Go Back"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              <button
                onClick={next}
                disabled={loading}
                className="flex-1 bg-white text-black font-semibold h-14 rounded-2xl hover:bg-gray-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                <span>
                  {loading
                    ? "Please wait..."
                    : step === steps.length - 1
                      ? "Complete Setup"
                      : "Continue"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mt-6 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-white/50" : "w-2 bg-white/10"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

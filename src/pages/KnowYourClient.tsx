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

const TOKEN = "app:authToken:v1";

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
        setDataToLocalStorage(TOKEN, data.token);
        setDataToLocalStorage("loginTimestamp", Date.now());
      } else {
        await registerUser(values.name, values.email, values.password);
        const { data } = await loginUser(values.email, values.password);
        setDataToLocalStorage(TOKEN, data.token);
        setDataToLocalStorage("loginTimestamp", Date.now());
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

      setDataToLocalStorage("name", values.name.trim());
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
        setDataToLocalStorage("email", email);
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
    <div className="flex justify-center items-end w-screen pb-10">
      <div className="space-y-4 text-center w-full max-w-2xl px-4">
        <div className="text-2xl sm:text-3xl font-semibold">
          {current.text} {current.emoji}
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            type={isPassword && !showPassword ? "password" : "text"}
            placeholder={current.placeholder}
            value={values[current.key as keyof Values]}
            onChange={onChange}
            onKeyDown={onKeyDown}
            disabled={loading}
            aria-label={current.text}
            aria-invalid={!!error}
            aria-describedby={error ? "input-error" : undefined}
            autoComplete={
              current.key === "email"
                ? "email"
                : current.key === "password"
                  ? emailExists
                    ? "current-password"
                    : "new-password"
                  : current.key === "confirmPassword"
                    ? "new-password"
                    : current.key === "name"
                      ? "name"
                      : "off"
            }
            className={`w-full outline-none border-b-2 text-center text-lg sm:text-xl py-2 placeholder:text-gray-400 transition-opacity ${
              isPassword ? "pr-10" : ""
            } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              disabled={loading}
              className="absolute right-2 top-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>

        {error && (
          <div id="input-error" role="alert" className="text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center">
          {step > 0 ? (
            <button
              onClick={goBack}
              disabled={loading}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded p-2 disabled:opacity-50"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={next}
            disabled={loading}
            className="text-base sm:text-lg font-medium flex items-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-4 py-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            {loading
              ? "Loading..."
              : step === steps.length - 1
                ? "Submit"
                : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

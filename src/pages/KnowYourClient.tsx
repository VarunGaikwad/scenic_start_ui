import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { checkEmailExists, loginUser, registerUser } from "@/api";
import { setDataToLocalStorage } from "@/utils";

type Values = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

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

  useEffect(() => {
    inputRef.current?.focus();
    setShowPassword(false);
    setError(null);
  }, [step]);

  const steps = [
    {
      key: "name",
      text: "Let's start with your name",
      emoji: "🙂",
      p: "Type your name",
    },
    {
      key: "email",
      text: "What's your email",
      emoji: "📮",
      p: "you@example.com",
    },
    ...(emailExists === true
      ? [
          {
            key: "password",
            text: "Welcome back!",
            emoji: "👋",
            p: "Enter your password",
          },
        ]
      : emailExists === false
        ? [
            {
              key: "password",
              text: "Create a password",
              emoji: "🛡️",
              p: "At least 8 characters",
            },
            {
              key: "confirmPassword",
              text: "One more time",
              emoji: "😄",
              p: "Repeat password",
            },
          ]
        : []),
  ];

  const current = steps[step];
  if (!current) return null;

  const isPassword =
    current.key === "password" || current.key === "confirmPassword";

  const goBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);

      // Reset emailExists if going back from password step
      if (step === 2 && emailExists !== null) {
        setEmailExists(null);
      }
    }
  };

  const next = async () => {
    if (loading) return;
    setError(null);

    const value = values[current.key as keyof Values];
    if (!value) return setError("Field cannot be empty.");

    if (current.key === "email") {
      if (!values.email.includes("@")) {
        return setError("Invalid email.");
      }

      setLoading(true);
      try {
        const { data } = await checkEmailExists(values.email);
        setEmailExists(data.exists);
        setDataToLocalStorage("email", values.email);
        setStep((s) => s + 1);
      } catch {
        setError("Email check failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (
      current.key === "confirmPassword" &&
      values.password !== values.confirmPassword
    ) {
      return setError("Passwords do not match.");
    }

    if (step < steps.length - 1) {
      setStep((s) => s + 1);
      return;
    }

    await submit();
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (emailExists) {
        const { data } = await loginUser(values.email, values.password);
        setDataToLocalStorage("authToken", data.token);
      } else {
        await registerUser(values.name, values.email, values.password);
        const { data } = await loginUser(values.email, values.password);
        setDataToLocalStorage("authToken", data.token);
      }

      window.location.reload();
    } catch {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg px-6 relative">
      {/* Go Back Button */}
      {step > 0 && (
        <button
          onClick={goBack}
          disabled={loading}
          className="absolute top-0 left-6 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
        >
          <ArrowLeft size={16} />
          <span>Go back</span>
        </button>
      )}

      <div key={step} className="animate-fade-up">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{current.emoji}</div>
          <h1 className="text-2xl font-semibold">{current.text}</h1>
        </div>

        {/* Input */}
        <div key={error ?? "ok"} className="relative max-w-md mx-auto">
          <input
            ref={inputRef}
            type={isPassword ? (showPassword ? "text" : "password") : "text"}
            placeholder={current.p}
            value={values[current.key as keyof Values]}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                [current.key]: e.target.value,
              }))
            }
            onKeyDown={(e) => e.key === "Enter" && next()}
            className={`w-full bg-transparent border-b-2 px-2 py-3 text-center text-lg tracking-tight focus:outline-none ${
              error
                ? "border-red-500 animate-shake"
                : "border-gray-300 focus:border-white"
            }`}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mt-3 text-center text-red-300">{error}</p>}

      <button
        onClick={next}
        disabled={loading}
        className="mt-8 w-full max-w-md mx-auto block text-center text-lg font-medium cursor-pointer hover:underline disabled:opacity-50"
      >
        {loading ? "Please wait..." : "Continue →"}
      </button>

      <div className="mt-4 text-center text-xs opacity-60">
        Step {step + 1} of {steps.length}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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

  const animateNext = () => setTimeout(() => setStep((s) => s + 1), 200);

  const next = async () => {
    if (loading) return;
    setError(null);

    const v = values[current.key as keyof Values];

    if (!v) return setError("Field cannot be empty.");

    if (current.key === "email") {
      if (!values.email.includes("@")) {
        return setError("Invalid email.");
      }

      setLoading(true);
      try {
        const { data } = await checkEmailExists(values.email);
        setEmailExists(data.exists);
        setDataToLocalStorage("email", values.email);
        animateNext();
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
      animateNext();
      return;
    }

    await submit();
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (emailExists) {
        const {
          data: { token },
        } = await loginUser(values.email, values.password);
        setDataToLocalStorage("authToken", token);
      } else {
        await registerUser(values.name, values.email, values.password);
        const {
          data: { token },
        } = await loginUser(values.email, values.password);
        setDataToLocalStorage("authToken", token);
      }

      window.location.reload();
    } catch {
      setError("Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="kyc__main">
      <div className="container">
        <span className="heading text-primary">
          {current.text}{" "}
          <span key={step} className="inline-block animate-pop">
            {current.emoji}
          </span>
        </span>

        <div className="relative">
          <input
            ref={inputRef}
            type={isPassword && !showPassword ? "password" : "text"}
            placeholder={current.p}
            value={values[current.key as keyof Values]}
            className="kyc__input"
            disabled={loading && current.key === "email"}
            onChange={(e) =>
              setValues({ ...values, [current.key]: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && next()}
          />

          {isPassword && (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-primary/60 hover:text-text-primary transition-colors"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}

          {loading && current.key === "email" && (
            <p className="text-sm text-text-primary/60 mt-2">
              Checking if this email exists…
            </p>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { checkEmailExists, loginUser, registerUser } from "@/api";
import { insertString, setDataToLocalStorage } from "@/utils";

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
      placeholder: "Your name",
    },
    {
      key: "email",
      text: "What's your email",
      emoji: "📮",
      placeholder: "you@example.com",
    },
    ...(emailExists === true
      ? [
          {
            key: "password",
            text: "Welcome back!",
            emoji: "👋",
            placeholder: "Enter your password",
          },
        ]
      : emailExists === false
        ? [
            {
              key: "password",
              text: "Create a password",
              emoji: "🛡️",
              placeholder: "At least 8 characters",
            },
            {
              key: "confirmPassword",
              text: "One more time",
              emoji: "😄",
              placeholder: "Repeat password",
            },
          ]
        : []),
  ];

  const current = steps[step];
  if (!current) return null;

  const isPassword =
    current.key === "password" || current.key === "confirmPassword";

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues((v) => ({ ...v, [current.key]: e.target.value }));
  };

  const goBack = () => {
    if (step === 0) return;
    setStep(step - 1);
    if (current.key === "password") {
      setEmailExists(null);
    }
  };

  const next = async () => {
    if (loading) return;
    setError(null);

    const value = values[current.key as keyof Values];
    if (!value) return setError("Field cannot be empty.");

    if (current.key === "email") {
      if (!/^\S+@\S+\.\S+$/.test(values.email)) {
        return setError("Invalid email.");
      }

      setLoading(true);
      try {
        const { data } = await checkEmailExists(values.email);
        setEmailExists(data.exists);
        setDataToLocalStorage("email", values.email);
        setStep(step + 1);
      } catch {
        setError("Email check failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (current.key === "password" && values.password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    if (
      current.key === "confirmPassword" &&
      values.password !== values.confirmPassword
    ) {
      return setError("Passwords do not match.");
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      await submit();
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (emailExists) {
        const { data } = await loginUser(values.email, values.password);
        const time = Date.now();
        setDataToLocalStorage(
          "authToken",
          insertString(data.token, String(time), 27),
        );
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      next();
    }
  };

  return (
    <div className="flex justify-center items-end w-screen pb-10">
      <div className="space-y-4 w-72 text-center">
        <div className="text-xl font-bold">
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
            className="w-full outline-0 border-b-2 text-center"
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-0 top-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-between">
          {step > 0 ? (
            <button onClick={goBack}>
              <ArrowLeft size={20} />
            </button>
          ) : (
            <div /> // keeps layout stable
          )}
          <button onClick={next} disabled={loading}>
            {loading ? "..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

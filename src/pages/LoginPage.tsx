import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface LoginPageProps {
  onLogin: (email: string, isAdmin: boolean) => void;
}

// 🔐 Hardcoded users (DO NOT REMOVE)
const VALID_USERS = [
  { email: "aavneet.johar@herovired.com", password: "Hx00007", isAdmin: true },
  { email: "trainings@herovired.com", password: "Hx00000", isAdmin: true },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔥 HARD-CODED USERS (priority)
      const hardcodedUser = VALID_USERS.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail &&
          u.password === password
      );

      if (hardcodedUser) {
        try {
          await createUserWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );
        } catch {
          await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            password
          );
        }

        onLogin(normalizedEmail, hardcodedUser.isAdmin);
        return;
      }

      // 🟣 SIGNUP FLOW (simple create)
      if (isSignup) {
        await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

        onLogin(normalizedEmail, false);
        return;
      }

      // 🔵 LOGIN FLOW (simple login)
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      onLogin(normalizedEmail, false);

    } catch (err: any) {
      console.error(err);

      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Account exists. Please login.");
          setIsSignup(false);
          break;

        case "auth/user-not-found":
          setError("User not found. Please sign up.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password");
          break;

        case "auth/weak-password":
          setError("Password must be at least 6 characters");
          break;

        case "auth/invalid-email":
          setError("Invalid email");
          break;

        default:
          setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage:
          "url('https://cdn.builder.io/api/v1/image/assets%2F88805948443b4c8f889eb67f299fc007%2F147ce9f561de4ad18f3a12346131fc96?format=webp&width=1600')",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 md:p-12 space-y-6 shadow-2xl">

          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Vired Pulse
            </h1>
            <p className="text-white/70">
              {isSignup ? "Create your account" : "Login to your account"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/60"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-white/60"
            />

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/20 py-2 px-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="vired-btn w-full py-3 rounded-xl text-lg"
            >
              {loading
                ? "Processing..."
                : isSignup
                ? "Create Account"
                : "Login"}
            </button>

          </form>

          {/* Toggle */}
          <p className="text-center text-white text-sm">
            {isSignup ? "Already have an account?" : "New user?"}{" "}
            <span
              className="underline cursor-pointer"
              onClick={() => {
                setIsSignup(!isSignup);
                setError("");
              }}
            >
              {isSignup ? "Login here" : "Sign up here"}
            </span>
          </p>

          {/* Demo */}
          <p className="text-center text-white/60 text-sm">
            Demo: trainings@herovired.com / Hx00000
          </p>

        </div>
      </div>
    </div>
  );
}
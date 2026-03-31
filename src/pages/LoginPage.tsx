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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/10 rounded-xl">

        <h1 className="text-3xl text-white text-center">
          {isSignup ? "Sign Up" : "Login"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 rounded bg-white/20 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 rounded bg-white/20 text-white"
          />

          {error && (
            <div className="text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 rounded"
          >
            {loading
              ? "Processing..."
              : isSignup
              ? "Create Account"
              : "Login"}
          </button>

        </form>

        {/* 🔥 SIMPLE TOGGLE LINK */}
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

        <p className="text-center text-white/60 text-sm">
          Demo: trainings@herovired.com / Hx00000
        </p>

      </div>
    </div>
  );
}
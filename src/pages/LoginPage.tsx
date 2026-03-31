import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
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

// 🔑 Invite codes
const VALID_INVITE_CODES = ["VIRED2026", "ADMINACCESS"];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 🔥 1. HARD-CODED USERS (TOP PRIORITY)
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
        } catch (err: any) {
          if (err.code === "auth/email-already-in-use") {
            await signInWithEmailAndPassword(
              auth,
              normalizedEmail,
              password
            );
          } else {
            console.error("Hardcoded error:", err);
            setError("Login failed. Please try again.");
            return;
          }
        }

        onLogin(normalizedEmail, hardcodedUser.isAdmin);
        return;
      }

      // 🔍 CHECK IF USER EXISTS (KEY FIX)
      const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);

      // 🟣 2. SIGNUP FLOW
      if (isSignup) {
        if (!VALID_INVITE_CODES.includes(inviteCode.toUpperCase())) {
          setError("Invalid invite code");
          return;
        }

        if (methods.length > 0) {
          setError("Account already exists. Please login.");
          setIsSignup(false);
          return;
        }

        await createUserWithEmailAndPassword(
          auth,
          normalizedEmail,
          password
        );

        onLogin(normalizedEmail, false);
        return;
      }

      // 🔵 3. LOGIN FLOW
      if (methods.length === 0) {
        setError("Account not found. Please sign up.");
        setIsSignup(true);
        return;
      }

      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      onLogin(normalizedEmail, false);

    } catch (err: any) {
      console.error("Auth Error:", err);

      switch (err.code) {
        case "auth/wrong-password":
          setError("Incorrect password");
          break;

        case "auth/weak-password":
          setError("Password must be at least 6 characters");
          break;

        case "auth/invalid-email":
          setError("Invalid email format");
          break;

        default:
          setError("Something went wrong. Try again.");
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
          "url('https://cdn.builder.io/api/v1/image/assets%2F88805948443b4c8f889eb67f299fc007%2F147ce9f561de4ad18f3a12346131fc96?format=webp&width=800&height=1200')",
      }}
    >
      <div className="absolute inset-0 bg-black/70"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card p-8 md:p-12 space-y-6">

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              Vired Pulse
            </h1>
            <p className="text-white/70">
              {isSignup ? "Create your account" : "Login to your account"}
            </p>
          </div>

          {/* 🔄 Toggle */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => {
                setIsSignup(false);
                setError("");
              }}
              className={`px-4 py-2 rounded-lg ${
                !isSignup ? "bg-white text-black" : "text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setIsSignup(true);
                setError("");
              }}
              className={`px-4 py-2 rounded-lg ${
                isSignup ? "bg-white text-black" : "text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white"
            />

            {isSignup && (
              <input
                type="text"
                placeholder="Enter Invite Code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white"
              />
            )}

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/20 py-2 px-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="vired-btn w-full py-3 rounded-xl"
            >
              {loading
                ? "Processing..."
                : isSignup
                ? "Create Account"
                : "Login"}
            </button>

          </form>

          <p className="text-center text-white/60 text-sm">
            Demo: trainings@herovired.com / Hx00000
          </p>

        </div>
      </div>
    </div>
  );
}
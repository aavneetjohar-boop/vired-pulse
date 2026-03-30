import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface LoginPageProps {
  onLogin: (email: string, isAdmin: boolean) => void;
}

const VALID_USERS = [
  { email: "aavneet.johar@herovired.com", password: "Hx00007", isAdmin: true },
  { email: "trainings@herovired.com", password: "Hx00000", isAdmin: true },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const hardcodedUser = VALID_USERS.find(
        (u) => u.email === email && u.password === password
      );

      // 🔥 HARD CODED USERS (SIMPLIFIED + ROBUST)
      if (hardcodedUser) {
        try {
          // Always try create first
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
          // If already exists → login
          if (err.code === "auth/email-already-in-use") {
            await signInWithEmailAndPassword(auth, email, password);
          } else {
            console.error("Hardcoded error:", err);
            setError("Login failed. Please try again.");
            return;
          }
        }

        onLogin(email, hardcodedUser.isAdmin);
        return;
      }

      // 🔥 NORMAL USERS
      try {
        await signInWithEmailAndPassword(auth, email, password);
        onLogin(email, false);
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          await createUserWithEmailAndPassword(auth, email, password);
          onLogin(email, false);
        } else if (err.code === "auth/wrong-password") {
          setError("Incorrect password");
        } else {
          console.error(err);
          setError("Login failed. Please try again.");
        }
      }

    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
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
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Vired Pulse
            </h1>
            <p className="text-lg text-white/80">
              Your AI-like Call Assistant
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            <input
              type="email"
              placeholder="Enter Hero Vired Email"
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

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/20 py-2 px-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="vired-btn w-full text-lg py-3 rounded-xl"
            >
              {loading ? "Logging in..." : "Login / Sign Up"}
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
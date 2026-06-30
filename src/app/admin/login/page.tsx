"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      window.location.href = "/admin";
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="font-display text-2xl font-bold uppercase text-foreground">Admin Login</h1>
        <div>
          <label className="mb-1 block text-sm text-metallic">Email</label>
          <input name="email" type="email" required className="w-full rounded border border-border bg-white px-3 py-2 text-foreground" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-metallic">Password</label>
          <input name="password" type="password" required className="w-full rounded border border-border bg-white px-3 py-2 text-foreground" />
        </div>
        {error && <p className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}

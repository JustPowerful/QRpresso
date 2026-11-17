"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type AuthFormProps = { mode: "login" | "register" };

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const values = new FormData(event.currentTarget as HTMLFormElement);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");

    try {
      const result = isRegister
        ? await authClient.signUp.email({
            name: String(values.get("name") ?? "").trim(),
            email,
            password,
          })
        : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(
          result.error.message ??
            "We couldn't complete your request. Please try again.",
        );
        return;
      }

      router.push("/clubs");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(460px,0.9fr)]">
      <section className="relative hidden overflow-hidden bg-[#182a23] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between xl:px-20">
        <div className="absolute -right-28 top-24 size-120 rounded-full border border-white/10" />
        <div className="absolute -right-12 top-40 size-104 rounded-full border border-white/10" />
        <Link
          href="/"
          className="relative z-10 flex items-center gap-3 text-sm font-semibold tracking-wide"
        >
          <span className="grid size-9 place-items-center rounded-full bg-[#d9e6d7] text-[#182a23]">
            a
          </span>
          ai hub
        </Link>
        <div className="relative z-10 max-w-xl pb-12">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#bbd0bd]">
            A calmer way to work with AI
          </p>
          <h1 className="font-heading text-5xl leading-[1.1] tracking-tight xl:text-6xl">
            Make room for your best thinking.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            Bring your tools, ideas, and conversations together in one
            thoughtful workspace.
          </p>
        </div>
        <p className="relative z-10 text-xs text-white/45">
          © 2026 AI Hub. Built for curious minds.
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-105">
          <Link
            href="/"
            className="mb-12 flex w-fit items-center gap-3 text-sm font-semibold lg:hidden"
          >
            <span className="grid size-9 place-items-center rounded-full bg-[#182a23] text-white">
              a
            </span>
            ai hub
          </Link>
          <div className="mb-9">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Welcome to AI Hub
            </p>
            <h2 className="font-heading text-4xl tracking-tight">
              {isRegister ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {isRegister
                ? "Start building a workspace that works the way you do."
                : "Sign in to pick up right where you left off."}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  required
                  minLength={2}
                />
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                {!isRegister && (
                  <span className="text-xs text-muted-foreground">
                    Forgot password?
                  </span>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="At least 8 characters"
                required
                minLength={8}
              />
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-md bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full justify-between px-5 text-xs"
              disabled={pending}
            >
              <span>
                {pending
                  ? isRegister
                    ? "Creating account…"
                    : "Signing in…"
                  : isRegister
                    ? "Create account"
                    : "Sign in"}
              </span>
              {pending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ArrowRight />
              )}
            </Button>
          </form>

          <p className="mt-7 text-center text-sm text-muted-foreground">
            {isRegister ? "Already have an account?" : "New to AI Hub?"}{" "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {isRegister ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <p className="mt-10 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="underline underline-offset-4">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}

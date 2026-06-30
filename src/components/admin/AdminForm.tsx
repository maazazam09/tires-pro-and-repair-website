"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

type ActionResult = { success?: boolean; message?: string } | void;

type AdminFormProps = {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  formKey?: string | number;
  successMessage?: string;
};

export function AdminForm({ action, children, className, formKey, successMessage }: AdminFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("");
    setError("");

    startTransition(async () => {
      try {
        const result = await action(formData);
        const message = result?.message ?? successMessage ?? "Saved successfully.";
        if (result?.success === false) {
          setError(message);
          return;
        }
        setStatus(message);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
      }
    });
  }

  return (
    <form key={formKey} onSubmit={handleSubmit} className={className}>
      {children}
      {isPending ? <p className="text-sm text-metallic">Saving...</p> : null}
      {status ? <p className="text-sm font-semibold text-accent">{status}</p> : null}
      {error ? <p className="text-sm font-semibold text-red-400">{error}</p> : null}
    </form>
  );
}
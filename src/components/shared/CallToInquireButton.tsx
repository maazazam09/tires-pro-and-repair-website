"use client";

import { Copy, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { siteConfig } from "@/lib/site-config";

export function CallToInquireButton({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(""), 1500);
    return () => window.clearTimeout(timeout);
  }, [status]);

  async function copyPhone() {
    try {
      await navigator.clipboard.writeText(siteConfig.phoneDisplay);
      setStatus("Copied!");
    } catch {
      setStatus("Copy unavailable");
    }
  }

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center ${className}`}>
      <a href={`tel:${siteConfig.phoneRaw}`} className="btn-primary min-h-12 justify-center text-sm">
        <Phone className="h-4 w-4" />
        Call to Inquire: {siteConfig.phoneDisplay}
      </a>
      <button
        type="button"
        onClick={copyPhone}
        className="btn-secondary min-h-12 justify-center text-sm"
        aria-label={`Copy phone number ${siteConfig.phoneDisplay}`}
      >
        <Copy className="h-4 w-4" />
        Copy
      </button>
      <span aria-live="polite" className="min-h-5 text-sm font-semibold text-accent">
        {status}
      </span>
    </div>
  );
}

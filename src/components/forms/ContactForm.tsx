"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@/lib/validators";
import type { z } from "zod";

type FormData = z.infer<typeof contactFormSchema>;

type ContactFormProps = {
  type?: "contact" | "quote";
  compact?: boolean;
  variant?: "dark" | "light";
};

const serviceOptions = [
  "New Tires",
  "Used Tires",
  "Custom Wheels",
  "Brake Service",
  "Wheel Alignment",
  "Suspension",
  "Other",
];

const timeSlots = [
  "8:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "12:00 PM - 2:00 PM",
  "2:00 PM - 4:00 PM",
  "4:00 PM - 6:00 PM",
];

export function ContactForm({ type = "contact", compact = false, variant = "dark" }: ContactFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const isBooking = type === "quote";
  const isLight = variant === "light";
  const labelClass = isLight ? "mb-1 block text-sm text-[#1A1A1A]" : "mb-1 block text-sm text-metallic";
  const inputClass = isLight
    ? "w-full rounded-md border border-[#d6d6d6] bg-white px-4 py-2 text-[#1A1A1A] outline-none focus:border-accent"
    : "w-full rounded-md border border-border bg-white px-4 py-2 text-foreground outline-none focus:border-accent";
  const formClass = compact
    ? "space-y-4"
    : isLight
      ? "space-y-4 rounded-lg border border-[#d6d6d6] bg-white p-6 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
      : "space-y-4 card";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { type },
  });

  async function onSubmit(data: FormData) {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        router.push("/contact/thank-you");
        return;
      }

      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setErrorMessage(body?.error ?? "Something went wrong. Please call us directly.");
      setStatus("error");
    } catch {
      setErrorMessage("Network error. Please call us directly.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={formClass}>
      <input type="hidden" {...register("type")} />
      <div>
        <label className={labelClass}>Name *</label>
        <input
          {...register("name")}
          className={inputClass}
        />
        {errors.name && <p className="mt-1 text-xs text-accent">{errors.name.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Phone *</label>
        <input
          {...register("phone")}
          type="tel"
          className={inputClass}
        />
        {errors.phone && <p className="mt-1 text-xs text-accent">{errors.phone.message}</p>}
      </div>
      <div>
        <label className={labelClass}>Email</label>
        <input
          {...register("email")}
          type="email"
          className={inputClass}
        />
      </div>
      {isBooking && (
        <>
          <div>
            <label className={labelClass}>Service Needed *</label>
            <select {...register("service")} className={inputClass}>
              <option value="">Select a service</option>
              {serviceOptions.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            {errors.service && <p className="mt-1 text-xs text-accent">{errors.service.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Preferred Date *</label>
              <input {...register("preferredDate")} type="date" className={inputClass} />
              {errors.preferredDate && <p className="mt-1 text-xs text-accent">{errors.preferredDate.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Preferred Time Slot *</label>
              <select {...register("preferredTime")} className={inputClass}>
                <option value="">Select a time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.preferredTime && <p className="mt-1 text-xs text-accent">{errors.preferredTime.message}</p>}
            </div>
          </div>
        </>
      )}
      <div>
        <label className={labelClass}>{isBooking ? "Notes / Vehicle Details *" : "Message *"}</label>
        <textarea
          {...register("message")}
          rows={compact ? 3 : 5}
          className={inputClass}
        />
        {errors.message && <p className="mt-1 text-xs text-accent">{errors.message.message}</p>}
      </div>
      <button type="submit" disabled={status === "loading"} className="btn-primary w-full">
        {status === "loading" ? "Sending..." : isBooking ? "Submit Booking" : "Send Message"}
      </button>
      {status === "error" && <p className="text-sm text-accent">{errorMessage}</p>}
    </form>
  );
}

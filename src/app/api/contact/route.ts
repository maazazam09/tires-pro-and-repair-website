import { NextResponse } from "next/server";
import { saveFormSubmission } from "@/lib/submissions-store";
import { sendAdminSubmissionEmail } from "@/lib/email";
import { contactFormSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = contactFormSchema.parse(body);

    const submission = await saveFormSubmission({
      type: data.type,
      name: data.name,
      phone: data.phone,
      email: data.email ?? "",
      service: data.service ?? "",
      preferredDate: data.preferredDate ?? "",
      preferredTime: data.preferredTime ?? "",
      message: data.message,
    });

    try {
      await sendAdminSubmissionEmail(submission);
    } catch (emailError) {
      console.error("Admin email notification failed:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Form submission failed:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Please check the form fields and try again." }, { status: 422 });
    }

    return NextResponse.json({ error: "We could not save your message. Please call us directly." }, { status: 500 });
  }
}

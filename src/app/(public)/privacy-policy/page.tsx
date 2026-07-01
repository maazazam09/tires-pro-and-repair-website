import { PageHeader } from "@/components/shared/PageHeader";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata("/privacy-policy", {
    title: "Privacy Policy | Tire Pro and Repair",
    description: "Privacy Policy for Tire Pro and Repair, a local tire, wheel, and auto service business in Chico, CA.",
  });
}

export default async function PrivacyPolicyPage() {
  const settings = await getSiteSettings();
  const contactEmail = settings.email || "info@tireproandrepair.com";

  return (
    <>
      <PageHeader
        title="Privacy Policy"
        subtitle="How Tire Pro and Repair collects, uses, and protects customer information."
      />
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-3xl break-words px-4 text-metallic">
          <p className="text-sm uppercase tracking-wide text-accent">Last updated: July 2, 2026</p>
          <div className="mt-6 space-y-8 text-sm leading-relaxed sm:text-base">
            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Overview</h2>
              <p>
                Tire Pro and Repair respects your privacy. This Privacy Policy explains how we collect, use, share,
                and protect information when you visit our website, contact us, request an appointment, ask about tires
                or wheels, submit service inquiries, or communicate with our shop.
              </p>
              <p>
                This policy applies to website visitors, customers, prospective customers, and anyone who contacts us
                about tire repair, tire sales, wheel sales, wheel alignment, suspension service, brake service, and
                related automotive services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Information We Collect</h2>
              <p>We may collect information you provide directly, including:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Name, phone number, email address, and preferred contact method.</li>
                <li>Appointment requests, preferred dates and times, and service notes.</li>
                <li>Vehicle details such as year, make, model, tire size, wheel size, symptoms, or repair needs.</li>
                <li>Messages, photos, videos, or other media you send to help us understand a service request.</li>
                <li>Payment, financing, or billing-related information handled by our payment or financing providers.</li>
              </ul>
              <p>
                We may also collect basic website information automatically, such as device type, browser type, pages
                visited, referring pages, approximate location from IP address, and interactions with forms or links.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">How We Use Information</h2>
              <p>We use information to operate our local business and provide better service, including to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Respond to calls, messages, appointment requests, quotes, and service inquiries.</li>
                <li>Confirm availability for tires, wheels, parts, shop time, or service appointments.</li>
                <li>Prepare estimates, service recommendations, repair orders, invoices, and customer records.</li>
                <li>Communicate about appointment reminders, service updates, approvals, pickup, and follow-up.</li>
                <li>Improve our website, advertising, customer experience, and service offerings.</li>
                <li>Protect our business, customers, staff, website, and legal rights.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Customer Communications</h2>
              <p>
                If you provide a phone number or email address, we may contact you about your inquiry, appointment,
                estimate, vehicle, parts availability, service authorization, financing request, or completed work. We
                may also send occasional service-related or promotional messages where permitted by law.
              </p>
              <p>
                Message and data rates may apply for text messages. Consent to receive marketing messages is not a
                condition of purchasing products or services. You may ask us to stop marketing communications at any
                time, though we may still contact you about active appointments, estimates, invoices, or safety-related
                service matters.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Cookies and Analytics</h2>
              <p>
                Our website may use cookies, pixels, analytics tools, and similar technologies to understand website
                traffic, improve performance, measure advertising, prevent misuse, and remember basic preferences. If
                Google Analytics or similar tools are enabled, those providers may process usage information according
                to their own policies.
              </p>
              <p>
                You can usually adjust cookie settings through your browser. Some website features may not work as
                intended if cookies are disabled.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Sharing Information</h2>
              <p>We do not sell customer information. We may share information when needed with:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Service providers that help operate our website, forms, hosting, analytics, communications, or CRM.</li>
                <li>Payment processors, financing providers, and fraud-prevention tools.</li>
                <li>Parts, tire, or wheel suppliers when needed to confirm fitment, availability, warranty, or orders.</li>
                <li>Professional advisors, insurers, or legal authorities when required or appropriate.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Photos, Videos, and Media</h2>
              <p>
                If you send photos or videos of your vehicle, tires, wheels, damage, warning lights, or service concerns,
                we may use that media to evaluate your request, communicate with you, document work, or coordinate with
                suppliers and technicians. We will not intentionally publish personally identifying customer media for
                marketing without appropriate permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Third-Party Links</h2>
              <p>
                Our website may link to financing providers, map services, social media platforms, review sites, tire or
                wheel manufacturers, and other third-party websites. We are not responsible for the privacy practices or
                content of those third parties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Data Security and Retention</h2>
              <p>
                We use reasonable administrative, technical, and physical safeguards to protect information. No website,
                email, text message, or storage system can be guaranteed completely secure. We keep information for as
                long as needed for business, service, warranty, tax, accounting, legal, and recordkeeping purposes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Your Choices</h2>
              <p>
                You may contact us to request access, correction, or deletion of personal information, subject to
                identity verification and legal or business recordkeeping requirements. You may also ask us to stop
                sending non-essential marketing communications.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Contact Us</h2>
              <p>
                Questions about this Privacy Policy may be sent to {contactEmail} or directed to Tire Pro and Repair at{" "}
                {settings.address}, {settings.city}, {settings.state} {settings.zip}. You may also call us at{" "}
                {settings.phone}.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

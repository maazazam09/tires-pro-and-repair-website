import { PageHeader } from "@/components/shared/PageHeader";
import { getSiteSettings } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildMetadata("/terms-and-conditions", {
    title: "Terms and Conditions | Tire Pro and Repair",
    description: "Terms and Conditions for Tire Pro and Repair website, appointments, tire sales, wheel sales, and auto services.",
  });
}

export default async function TermsAndConditionsPage() {
  const settings = await getSiteSettings();
  const contactEmail = settings.email || "info@tireproandrepair.com";

  return (
    <>
      <PageHeader
        title="Terms and Conditions"
        subtitle="Website, appointment, product, and service terms for Tire Pro and Repair."
      />
      <section className="py-10 sm:py-16">
        <div className="mx-auto max-w-3xl break-words px-4 text-metallic">
          <p className="text-sm uppercase tracking-wide text-accent">Last updated: July 2, 2026</p>
          <div className="mt-6 space-y-8 text-sm leading-relaxed sm:text-base">
            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Agreement to These Terms</h2>
              <p>
                These Terms and Conditions apply when you use the Tire Pro and Repair website, request information,
                schedule or request an appointment, purchase tires or wheels, or receive automotive services from our
                shop. By using this website or doing business with us, you agree to these terms.
              </p>
              <p>
                These terms are intended for general customer and website use. A written repair order, invoice, financing
                agreement, manufacturer warranty, or signed authorization may include additional terms for a specific
                transaction.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Services</h2>
              <p>
                Tire Pro and Repair provides local automotive services that may include new and used tire sales, tire
                repair, tire installation, balancing, custom wheels, wheel fitment, wheel alignment, suspension service,
                brake service, inspections, and related work. Service availability may vary based on staffing, equipment,
                parts availability, vehicle condition, and scheduling.
              </p>
              <p>
                We may decline or discontinue work when a vehicle, tire, wheel, part, modification, or requested service
                presents a safety concern, fitment concern, legal concern, payment concern, or other business risk.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Appointments and Scheduling</h2>
              <p>
                Appointment requests submitted through the website, phone, email, text, or social media are requests
                only until confirmed by our staff. Appointment times are estimates and may change due to prior jobs,
                parts delivery, vehicle condition, diagnostic findings, staffing, or other shop conditions.
              </p>
              <p>
                Please arrive on time and provide accurate contact and vehicle information. If you need to cancel or
                reschedule, contact us as soon as possible so we can offer the appointment time to another customer.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Estimates, Pricing, and Availability</h2>
              <p>
                Website pricing, product descriptions, service descriptions, promotions, and availability are provided
                for general information and may change without notice. Tire, wheel, part, and labor prices can vary based
                on vehicle fitment, size, brand, condition, supply, taxes, disposal fees, shop supplies, and additional
                work approved by the customer.
              </p>
              <p>
                Estimates are not final invoices. A final price may change after inspection, diagnosis, fitment review,
                or discovery of additional service needs. We will seek customer approval before performing additional
                paid work beyond the authorized scope, except where immediate action is reasonably necessary for safety
                or to protect the vehicle.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Tire, Wheel, and Fitment Responsibility</h2>
              <p>
                Customers are responsible for providing accurate vehicle details and confirming requested tire or wheel
                sizes when relevant. We may recommend fitment options, but final compatibility can depend on vehicle
                modifications, suspension setup, brake clearance, load rating, driving use, manufacturer specifications,
                and local requirements.
              </p>
              <p>
                Custom wheel and tire combinations may affect ride quality, speedometer accuracy, clearance, rubbing,
                handling, road noise, fuel economy, tire wear, and warranty coverage. We are not responsible for issues
                caused by inaccurate customer information, customer-supplied parts, undisclosed modifications, or
                fitment choices made against our recommendation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Used Tires and Customer-Supplied Parts</h2>
              <p>
                Used tires are sold or installed based on their condition at the time of sale or installation and may
                have limited remaining tread life, age, cosmetic wear, prior repairs, or other limitations. Customer-
                supplied tires, wheels, or parts may be accepted at our discretion and may not be covered by shop
                warranties.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Authorization and Vehicle Access</h2>
              <p>
                By leaving a vehicle with us, requesting service, or approving work by phone, text, email, website form,
                or in person, you authorize Tire Pro and Repair to inspect, move, test, and perform the approved work on
                the vehicle. Test drives or vehicle movement may be necessary for diagnosis, repair verification,
                alignment, brake service, or safety checks.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Payments and Financing</h2>
              <p>
                Payment is due according to the invoice or agreed payment terms. We may accept payment methods available
                at the time of service. Financing options, if offered, are provided by third-party financing companies
                and are subject to their approval, terms, disclosures, fees, and privacy practices.
              </p>
              <p>
                Returned payments, chargebacks, late payments, unpaid invoices, storage, collection costs, or other
                account issues may result in additional fees to the extent permitted by law.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Warranties and Limitations</h2>
              <p>
                Manufacturer warranties may apply to eligible new tires, wheels, or parts and are controlled by the
                manufacturer. Shop workmanship warranties, if any, will be described on the invoice, repair order, or by
                staff at the time of service. Warranty coverage may be limited or voided by misuse, racing, off-road use,
                impacts, improper maintenance, customer-supplied parts, modifications, or unrelated vehicle problems.
              </p>
              <p>
                To the fullest extent allowed by law, our website and services are provided without guarantees beyond
                those expressly stated in writing. We are not liable for indirect, incidental, special, or consequential
                damages arising from website use, appointment delays, product unavailability, or service outcomes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Customer Communications</h2>
              <p>
                You agree that we may contact you using the phone number, email address, or other contact method you
                provide for appointment confirmations, service updates, estimates, approvals, pickup notices, invoices,
                financing follow-up, and customer support. Marketing messages may be sent where permitted by law and may
                be opted out of at any time.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Website Content and Third-Party Links</h2>
              <p>
                Website content is provided for general information. We try to keep information accurate, but errors,
                outdated details, or omissions may occur. Links to maps, social media, financing providers, manufacturers,
                review platforms, or other websites are provided for convenience. We do not control third-party websites
                and are not responsible for their content, policies, or services.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Photos, Reviews, and Feedback</h2>
              <p>
                If you provide reviews, testimonials, photos, videos, or feedback, you confirm that you have the right to
                share that content with us. We may use non-confidential feedback to improve our services. We will not
                intentionally publish personally identifying customer media for marketing without appropriate permission.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Changes to These Terms</h2>
              <p>
                We may update these Terms and Conditions from time to time. The updated version will be posted on this
                page with a revised date. Continued use of the website or our services after updates means you accept the
                revised terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-display break-words text-xl font-bold uppercase text-foreground sm:text-2xl">Contact Us</h2>
              <p>
                Questions about these Terms and Conditions may be sent to {contactEmail} or directed to Tire Pro and
                Repair at {settings.address}, {settings.city}, {settings.state} {settings.zip}. You may also call us at{" "}
                {settings.phone}.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

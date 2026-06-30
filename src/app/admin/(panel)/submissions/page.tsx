import { getFormSubmissions } from "@/lib/data";

export default async function AdminSubmissionsPage() {
  const submissions = await getFormSubmissions(50);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Form Submissions</h1>
      <div className="mt-8 space-y-4">
        {submissions.length === 0 ? (
          <p className="text-metallic">No submissions yet.</p>
        ) : (
          submissions.map((s) => (
            <div key={s.id} className="card">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-semibold text-white">{s.name}</span>
                <span className="text-sm text-metallic">
                  {s.type === "quote" ? "booking" : s.type} · {s.createdAt.toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm text-metallic">
                {s.phone} {s.email && `· ${s.email}`}
              </p>
              {(s.service || s.preferredDate || s.preferredTime) && (
                <div className="mt-3 grid gap-2 rounded-md border border-white/10 bg-background/60 p-3 text-sm text-metallic sm:grid-cols-3">
                  {s.service && (
                    <p>
                      <span className="font-semibold text-white">Service:</span> {s.service}
                    </p>
                  )}
                  {s.preferredDate && (
                    <p>
                      <span className="font-semibold text-white">Date:</span> {s.preferredDate}
                    </p>
                  )}
                  {s.preferredTime && (
                    <p>
                      <span className="font-semibold text-white">Time:</span> {s.preferredTime}
                    </p>
                  )}
                </div>
              )}
              <p className="mt-2 text-white">{s.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

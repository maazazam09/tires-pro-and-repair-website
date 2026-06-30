import { getDashboardStats, getFormSubmissions } from "@/lib/data";

export default async function AdminDashboard() {
  const [stats, submissions] = await Promise.all([
    getDashboardStats(),
    getFormSubmissions(5),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold uppercase text-white">Dashboard</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className="card text-center">
            <p className="text-3xl font-bold text-accent">{value}</p>
            <p className="mt-1 text-sm capitalize text-metallic">{key}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold uppercase text-white">Recent Submissions</h2>
        <div className="mt-4 space-y-3">
          {submissions.length === 0 ? (
            <p className="text-metallic">No submissions yet.</p>
          ) : (
            submissions.map((s) => (
              <div key={s.id} className="card text-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">{s.name}</span>
                  <span className="text-metallic">
                    {s.type === "quote" ? "booking" : s.type} · {s.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-metallic">
                  {s.phone}
                  {s.service && ` · ${s.service}`}
                  {s.preferredDate && ` · ${s.preferredDate}`}
                  {s.preferredTime && ` · ${s.preferredTime}`}
                </p>
                <p className="mt-1 text-metallic">{s.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

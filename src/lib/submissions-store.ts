import { get, list, put } from "@vercel/blob";
import { Pool } from "pg";
import { getRuntimeEnv } from "@/lib/runtime-env";

export type FormSubmissionRecord = {
  id: string;
  type: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  createdAt: Date;
};

type SubmissionInput = {
  type: string;
  name: string;
  phone: string;
  email: string;
  service?: string;
  preferredDate?: string;
  preferredTime?: string;
  message: string;
};

let postgresPool: Pool | null = null;

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isPostgresDatabaseUrl() {
  const databaseUrl = getRuntimeEnv("DATABASE_URL");
  return databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://");
}

function hasSupabaseRestStorage() {
  return Boolean(getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL") && getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

function hasRemoteDatabase() {
  return Boolean(
    hasSupabaseRestStorage() ||
    (getRuntimeEnv("TURSO_DATABASE_URL") && getRuntimeEnv("TURSO_AUTH_TOKEN")) ||
      isPostgresDatabaseUrl(),
  );
}

function preferredSubmissionStorage() {
  const configured = getRuntimeEnv("FORM_SUBMISSIONS_STORAGE").toLowerCase();

  if (configured === "blob" && hasBlobStorage()) return "blob";
  if (configured === "database") return "database";
  if (hasRemoteDatabase() || !hasBlobStorage()) return "database";

  return "blob";
}

function canReadBlobSubmissions() {
  return hasBlobStorage();
}

function getPostgresPool() {
  const connectionString = getRuntimeEnv("DATABASE_URL");
  if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL submissions.");

  postgresPool ??= new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
  });

  return postgresPool;
}

async function saveBlobSubmission(data: SubmissionInput): Promise<FormSubmissionRecord> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const record = {
    id,
    type: data.type,
    name: data.name,
    phone: data.phone,
    email: data.email,
    service: data.service ?? "",
    preferredDate: data.preferredDate ?? "",
    preferredTime: data.preferredTime ?? "",
    message: data.message,
    createdAt: new Date().toISOString(),
  };

  await put(`submissions/${id}.json`, JSON.stringify(record), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });

  return { ...record, createdAt: new Date(record.createdAt) };
}

async function getBlobSubmissions(limit: number): Promise<FormSubmissionRecord[]> {
  if (!canReadBlobSubmissions()) return [];

  try {
    const { blobs } = await list({ prefix: "submissions/", limit: 1000 });
    const records = await Promise.all(
      blobs.map(async (blob) => {
        const result = await get(blob.pathname, { access: "private", useCache: false });
        if (!result || result.statusCode !== 200) return null;

        const raw = JSON.parse(await new Response(result.stream).text()) as {
          id: string;
          type: string;
          name: string;
          phone: string;
          email: string;
          service?: string;
          preferredDate?: string;
          preferredTime?: string;
          message: string;
          createdAt: string;
        };

        return {
          ...raw,
          service: raw.service ?? "",
          preferredDate: raw.preferredDate ?? "",
          preferredTime: raw.preferredTime ?? "",
          createdAt: new Date(raw.createdAt),
        };
      }),
    );

    return records
      .filter((r): r is FormSubmissionRecord => r !== null)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Unable to read Blob form submissions:", error);
    return [];
  }
}

async function saveDatabaseSubmission(data: SubmissionInput): Promise<FormSubmissionRecord> {
  if (hasSupabaseRestStorage()) {
    return saveSupabaseRestSubmission(data);
  }

  if (isPostgresDatabaseUrl()) {
    return savePostgresSubmission(data);
  }

  const { prisma } = await import("@/lib/prisma");
  const created = await prisma.formSubmission.create({
    data: {
      type: data.type,
      name: data.name,
      phone: data.phone,
      email: data.email,
      service: data.service ?? "",
      preferredDate: data.preferredDate ?? "",
      preferredTime: data.preferredTime ?? "",
      message: data.message,
    },
  });

  return {
    id: created.id,
    type: created.type,
    name: created.name,
    phone: created.phone,
    email: created.email,
    service: created.service,
    preferredDate: created.preferredDate,
    preferredTime: created.preferredTime,
    message: created.message,
    createdAt: created.createdAt,
  };
}

async function getDatabaseSubmissions(limit: number): Promise<FormSubmissionRecord[]> {
  if (hasSupabaseRestStorage()) {
    return getSupabaseRestSubmissions(limit);
  }

  if (isPostgresDatabaseUrl()) {
    return getPostgresSubmissions(limit);
  }

  const { prisma } = await import("@/lib/prisma");
  const rows = await prisma.formSubmission.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    phone: row.phone,
    email: row.email,
    service: row.service,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    message: row.message,
    createdAt: row.createdAt,
  }));
}

function supabaseRestUrl(path: string) {
  const baseUrl = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for Supabase submissions.");
  return `${baseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

function supabaseRestHeaders(extra: HeadersInit = {}) {
  const serviceRoleKey = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for Supabase submissions.");

  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function saveSupabaseRestSubmission(data: SubmissionInput): Promise<FormSubmissionRecord> {
  const response = await fetch(supabaseRestUrl("FormSubmission"), {
    method: "POST",
    headers: supabaseRestHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({
      type: data.type,
      name: data.name,
      phone: data.phone,
      email: data.email,
      service: data.service ?? "",
      preferredDate: data.preferredDate ?? "",
      preferredTime: data.preferredTime ?? "",
      message: data.message,
    }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    throw new Error(`Supabase submission insert failed: ${response.status} ${error}`);
  }

  const rows = await response.json() as Array<{
    id: string;
    type: string;
    name: string;
    phone: string;
    email: string;
    service: string;
    preferredDate: string;
    preferredTime: string;
    message: string;
    createdAt: string;
  }>;

  return normalizePostgresSubmission(rows[0]);
}

async function getSupabaseRestSubmissions(limit: number): Promise<FormSubmissionRecord[]> {
  const params = new URLSearchParams({
    select: '"id","type","name","phone","email","service","preferredDate","preferredTime","message","createdAt"',
    order: '"createdAt".desc',
    limit: String(limit),
  });
  const response = await fetch(supabaseRestUrl(`FormSubmission?${params.toString()}`), {
    headers: supabaseRestHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    throw new Error(`Supabase submission read failed: ${response.status} ${error}`);
  }

  const rows = await response.json() as Array<{
    id: string;
    type: string;
    name: string;
    phone: string;
    email: string;
    service: string;
    preferredDate: string;
    preferredTime: string;
    message: string;
    createdAt: string;
  }>;

  return rows.map(normalizePostgresSubmission);
}

async function countSupabaseRestSubmissions() {
  const response = await fetch(supabaseRestUrl("FormSubmission?select=id"), {
    method: "HEAD",
    headers: supabaseRestHeaders({ Prefer: "count=exact" }),
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text().catch(() => "");
    throw new Error(`Supabase submission count failed: ${response.status} ${error}`);
  }

  const range = response.headers.get("content-range");
  const count = range?.split("/")[1];
  return count && count !== "*" ? Number(count) : 0;
}

async function savePostgresSubmission(data: SubmissionInput): Promise<FormSubmissionRecord> {
  const result = await getPostgresPool().query<{
    id: string;
    type: string;
    name: string;
    phone: string;
    email: string;
    service: string;
    preferredDate: string;
    preferredTime: string;
    message: string;
    createdAt: Date;
  }>(
    `
      insert into public."FormSubmission"
        ("type", "name", "phone", "email", "service", "preferredDate", "preferredTime", "message")
      values
        ($1, $2, $3, $4, $5, $6, $7, $8)
      returning
        "id", "type", "name", "phone", "email", "service", "preferredDate", "preferredTime", "message", "createdAt"
    `,
    [
      data.type,
      data.name,
      data.phone,
      data.email,
      data.service ?? "",
      data.preferredDate ?? "",
      data.preferredTime ?? "",
      data.message,
    ],
  );

  return normalizePostgresSubmission(result.rows[0]);
}

async function getPostgresSubmissions(limit: number): Promise<FormSubmissionRecord[]> {
  const result = await getPostgresPool().query<{
    id: string;
    type: string;
    name: string;
    phone: string;
    email: string;
    service: string;
    preferredDate: string;
    preferredTime: string;
    message: string;
    createdAt: Date;
  }>(
    `
      select
        "id", "type", "name", "phone", "email", "service", "preferredDate", "preferredTime", "message", "createdAt"
      from public."FormSubmission"
      order by "createdAt" desc
      limit $1
    `,
    [limit],
  );

  return result.rows.map(normalizePostgresSubmission);
}

function normalizePostgresSubmission(row: {
  id: string;
  type: string;
  name: string;
  phone: string;
  email: string;
  service: string;
  preferredDate: string;
  preferredTime: string;
  message: string;
  createdAt: Date | string;
}): FormSubmissionRecord {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    phone: row.phone,
    email: row.email,
    service: row.service,
    preferredDate: row.preferredDate,
    preferredTime: row.preferredTime,
    message: row.message,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt),
  };
}

export async function saveFormSubmission(data: SubmissionInput): Promise<FormSubmissionRecord> {
  if (preferredSubmissionStorage() === "blob") {
    return saveBlobSubmission(data);
  }

  return saveDatabaseSubmission(data);
}

export async function getFormSubmissions(limit = 50): Promise<FormSubmissionRecord[]> {
  const storage = preferredSubmissionStorage();

  if (storage === "blob") {
    return getBlobSubmissions(limit);
  }

  const [databaseRecords, blobRecords] = await Promise.all([
    getDatabaseSubmissions(limit),
    getBlobSubmissions(limit),
  ]);

  return [...databaseRecords, ...blobRecords]
    .filter((record, index, records) => records.findIndex((item) => item.id === record.id) === index)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

export async function countFormSubmissions(): Promise<number> {
  if (preferredSubmissionStorage() === "blob") {
    return getBlobSubmissions(1000).then((records) => records.length);
  }

  const databaseCount = hasSupabaseRestStorage()
    ? await countSupabaseRestSubmissions()
    : isPostgresDatabaseUrl()
      ? Number((await getPostgresPool().query<{ count: string }>('select count(*) as count from public."FormSubmission"')).rows[0].count)
      : await import("@/lib/prisma").then(({ prisma }) => prisma.formSubmission.count());
  const blobRecords = await getBlobSubmissions(1000);

  return databaseCount + blobRecords.length;
}

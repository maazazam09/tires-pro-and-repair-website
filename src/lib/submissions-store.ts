import { get, list, put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

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

function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function hasRemoteDatabase() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  return Boolean(
    (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) ||
      databaseUrl.startsWith("postgres://") ||
      databaseUrl.startsWith("postgresql://"),
  );
}

function preferredSubmissionStorage() {
  const configured = process.env.FORM_SUBMISSIONS_STORAGE?.toLowerCase();

  if (configured === "blob" && hasBlobStorage()) return "blob";
  if (configured === "database") return "database";
  if (hasRemoteDatabase() || !hasBlobStorage()) return "database";

  return "blob";
}

function canReadBlobSubmissions() {
  return hasBlobStorage();
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

  const [databaseCount, blobRecords] = await Promise.all([
    prisma.formSubmission.count(),
    getBlobSubmissions(1000),
  ]);

  return databaseCount + blobRecords.length;
}

import fs from "node:fs";
import path from "node:path";

let fileEnv: Record<string, string> | null = null;

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return {};

  const result: Record<string, string> = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    result[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return result;
}

function loadFileEnv() {
  if (fileEnv) return fileEnv;

  fileEnv = {
    ...parseEnvFile(path.join(process.cwd(), ".env.vercel.production")),
    ...parseEnvFile(path.join(process.cwd(), ".env.production.local")),
    ...parseEnvFile(path.join(process.cwd(), ".env")),
  };

  return fileEnv;
}

export function getRuntimeEnv(name: string) {
  return process.env[name] || loadFileEnv()[name] || "";
}

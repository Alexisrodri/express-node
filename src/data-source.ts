import "reflect-metadata";
import { DataSource } from "typeorm";
import { DafTiposIdentificacion } from "./entities/DafTiposIdentificacion";
import { MgmPacientes } from "./entities/MgmPacientes";

function parseDatabaseUrl(url: string | undefined) {
  if (!url || !url.includes("://")) return null;

  try {
    let urlToParse = url.trim();
    if (urlToParse.startsWith("oracle://")) {
      urlToParse = "http://" + urlToParse.substring("oracle://".length);
    } else if (urlToParse.includes("://")) {
      urlToParse = urlToParse.replace(/^[^:]+:\/\//, "http://");
    } else {
      return null;
    }
    
    const parsed = new URL(urlToParse);
    
    const username = parsed.username || undefined;
    const password = parsed.password || undefined;
    const host = parsed.hostname || undefined;
    const port = parsed.port ? parseInt(parsed.port) : undefined;
    let sid = parsed.pathname.replace(/^\//, "").replace(/\/$/, "").toUpperCase();
    if (!sid || sid === "") {
      sid = undefined;
    }
    
    if (!host || !username) {
      return null;
    }
    
    return { username, password, host, port, sid };
  } catch (error) {
    console.warn("⚠️ Error parsing DATABASE_URL, usando campos separados (DB_HOST, DB_USER, etc.):", (error as Error).message);
    return null;
  }
}

const databaseUrl = process.env.DATABASE_URL;

let parsedUrl = null;
if (databaseUrl) {
  console.log("ℹ️  DATABASE_URL detectada, parseando a campos separados...");
  parsedUrl = parseDatabaseUrl(databaseUrl);
  if (!parsedUrl) {
    console.warn("⚠️  No se pudo parsear DATABASE_URL, usando campos separados (DB_HOST, DB_USER, etc.)");
  } else {
    console.log("✅ DATABASE_URL parseada correctamente");
  }
}

const dbConfig = {
  type: "oracle" as const,
  host: process.env.DB_HOST || parsedUrl?.host || "localhost",
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : (parsedUrl?.port || 1521),
  username: process.env.DB_USER || parsedUrl?.username || "system",
  password: process.env.DB_PASSWORD || parsedUrl?.password || "Oracle123",
  sid: process.env.DB_SID || parsedUrl?.sid || "XE",
};

if (!dbConfig.username || !dbConfig.password) {
  console.error("❌ Error: DB_USER y DB_PASSWORD son requeridos.");
  console.error("   Configura en .env:");
  console.error("   DB_HOST=localhost");
  console.error("   DB_PORT=1521");
  console.error("   DB_SID=XE");
  console.error("   DB_USER=system");
  console.error("   DB_PASSWORD=Oracle123");
  throw new Error("Credenciales de base de datos no configuradas");
}

console.log(`🔌 Conectando a Oracle: ${dbConfig.username}@${dbConfig.host}:${dbConfig.port}/${dbConfig.sid}`);

export const AppDataSource = new DataSource({
  ...dbConfig,
  synchronize: false,
  logging: true,
  entities: [DafTiposIdentificacion, MgmPacientes],
  migrations: ["src/migrations/**/*.ts"],
  subscribers: ["src/subscribers/**/*.ts"],
});


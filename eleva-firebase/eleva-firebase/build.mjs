// Injeta a config do Firebase (.env) no HTML. Uso: node build.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const env = {};
if (!existsSync(".env")) { console.error("Falta o ficheiro .env (copia .env.example)."); process.exit(1); }
for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const need = ["FIREBASE_API_KEY","FIREBASE_AUTH_DOMAIN","FIREBASE_PROJECT_ID","FIREBASE_STORAGE_BUCKET","FIREBASE_MESSAGING_SENDER_ID","FIREBASE_APP_ID"];
const missing = need.filter((k) => !env[k]);
if (missing.length) { console.error("Faltam no .env:", missing.join(", ")); process.exit(1); }

const cfg = {
  apiKey: env.FIREBASE_API_KEY, authDomain: env.FIREBASE_AUTH_DOMAIN, projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE_BUCKET, messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
  appId: env.FIREBASE_APP_ID, functionsRegion: env.FIREBASE_FUNCTIONS_REGION || "europe-west1",
};
const tpl = readFileSync("src/index.template.html", "utf8");
const marker = "/*__ELEVA_FIREBASE_CONFIG__*/{}";
if (!tpl.includes(marker)) { console.error("Marcador de config não encontrado no template."); process.exit(1); }
mkdirSync("dist", { recursive: true });
writeFileSync("dist/index.html", tpl.replace(marker, JSON.stringify(cfg)));
console.log("OK → dist/index.html");

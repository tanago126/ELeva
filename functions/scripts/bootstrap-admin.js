"use strict";
/**
 * Cria (ou promove) a primeira conta ADMIN. Corre UMA vez, no teu computador.
 *
 *   export GOOGLE_APPLICATION_CREDENTIALS=/caminho/serviceAccount.json
 *   ELEVA_ADMIN_PASSWORD='a-tua-password' node functions/scripts/bootstrap-admin.js \
 *       --email=tu@dominio.com --name="O Teu Nome" --initials=AD
 *
 * A password vem de variável de ambiente (não fica no código).
 */
const admin = require("firebase-admin");
admin.initializeApp();

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || "").split("=").slice(1).join("=");
const email = arg("email").toLowerCase();
const name = arg("name") || "Admin";
const initials = (arg("initials") || "AD").toUpperCase();
const password = process.env.ELEVA_ADMIN_PASSWORD || "";

(async () => {
  if (!email) throw new Error("Falta --email=");
  let user;
  try {
    user = await admin.auth().getUserByEmail(email);
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    if (password.length < 8) throw new Error("Define ELEVA_ADMIN_PASSWORD (mín. 8 caracteres) para criar a conta.");
    user = await admin.auth().createUser({ email, password, displayName: name });
  }
  await admin.auth().setCustomUserClaims(user.uid, { role: "admin" });
  await admin.firestore().doc(`users/${user.uid}`).set(
    { name, initials, email, role: "admin", active: true, createdBy: user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
  console.log(`OK — admin ${email} (uid ${user.uid}).`);
})().catch((e) => { console.error("Erro:", e.message); process.exit(1); });

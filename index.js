"use strict";
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: process.env.ELEVA_REGION || "europe-west1", maxInstances: 5 });

const db = admin.firestore();
const ROLES = ["admin", "trainer"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Só um ADMIN ativo pode chamar. Cria o utilizador no Auth com a password definida
 * pelo admin, define a custom claim "role" e grava users/{uid}.
 */
exports.createUserAsAdmin = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sessão necessária.");

  const callerUid = request.auth.uid;
  const callerSnap = await db.doc(`users/${callerUid}`).get();
  if (!callerSnap.exists || callerSnap.data().role !== "admin" || callerSnap.data().active === false) {
    throw new HttpsError("permission-denied", "Só o admin pode criar contas.");
  }

  const d = request.data || {};
  const email = String(d.email || "").trim().toLowerCase();
  const password = String(d.password || "");
  const name = String(d.name || "").trim();
  const initials = String(d.initials || "").trim().toUpperCase();
  const role = String(d.role || "trainer");

  if (!EMAIL_RE.test(email)) throw new HttpsError("invalid-argument", "Email inválido.");
  if (password.length < 8) throw new HttpsError("invalid-argument", "A password deve ter pelo menos 8 caracteres.");
  if (name.length < 2 || name.length > 80) throw new HttpsError("invalid-argument", "Nome inválido.");
  if (!/^[A-Z]{1,4}$/.test(initials)) throw new HttpsError("invalid-argument", "Iniciais inválidas (1–4 letras).");
  if (!ROLES.includes(role)) throw new HttpsError("invalid-argument", "Papel inválido.");

  let userRecord;
  try {
    userRecord = await admin.auth().createUser({ email, password, displayName: name, emailVerified: false });
  } catch (e) {
    if (e.code === "auth/email-already-exists") throw new HttpsError("already-exists", "Já existe uma conta com esse email.");
    if (e.code === "auth/invalid-password") throw new HttpsError("invalid-argument", "Password inválida.");
    if (e.code === "auth/invalid-email") throw new HttpsError("invalid-argument", "Email inválido.");
    console.error("createUser falhou:", e.code);
    throw new HttpsError("internal", "Não foi possível criar o utilizador.");
  }

  try {
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });
    await db.doc(`users/${userRecord.uid}`).set({
      name, initials, email, role,
      active: true,
      createdBy: callerUid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error("Pós-criação falhou, a reverter:", e.code || e.message);
    await admin.auth().deleteUser(userRecord.uid).catch(() => {});
    throw new HttpsError("internal", "Falha ao gravar o perfil; conta revertida.");
  }

  return { uid: userRecord.uid, email, role };
});

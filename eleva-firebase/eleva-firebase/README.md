# Eleva — Firebase Auth + Firestore (plano gratuito Spark, sem Cloud Functions)

## Ficheiros
- `dist/index.html` — a app pronta a usar (config já injetada)
- `src/index.template.html` + `build.mjs` + `.env.example` — para regenerar o `dist` quando mudares a app
- `firestore.rules` — Security Rules (role + dono)
- `extras-blaze/` — versão com Cloud Function (só se um dia passares ao plano Blaze)

## Passos (tudo gratuito)
1. **Authentication → Método de início de sessão → Email/Password → ativar.**
2. **Publicar as regras**: `firebase use ritmo-b132d` e `firebase deploy --only firestore:rules`
   (ou colar o `firestore.rules` em Firestore Database → Regras → Publicar).
3. **Criar o admin à mão**:
   - Authentication → Utilizadores → Adicionar utilizador (email + password). Copia o **UID**.
   - Firestore Database → coleção `users` → documento com ID = esse UID, campos:
     `name` (string), `initials` (string, ex. AD), `email` (string), `role` = `admin` (string),
     `active` = true (boolean), `createdBy` = o mesmo UID (string).
4. Abrir `dist/index.html` (servido por `firebase deploy --only hosting` ou `npx serve dist`), entrar como admin → **👥 Contas** → criar AQ e HA.
5. Authentication → Definições → Domínios autorizados: adicionar o domínio onde publicas.

## Limitação do plano gratuito
Sem Cloud Function, o Firebase Auth continua a aceitar registos feitos por fora da app (via API).
Essas contas ficam **sem acesso a nada**: as regras exigem um perfil `users/{uid}` ativo, que só o admin pode criar.

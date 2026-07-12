# Setup — Schritt für Schritt

Der Code steht. Diese Anleitung führt dich durch die Accounts und Einstellungen, die
nur du klicken kannst. Rechne mit ~20 Minuten.

---

## 1. Supabase (Datenbank + Login) — kostenlos

1. Geh auf **supabase.com** → „Start your project“ → mit GitHub oder E-Mail anmelden.
2. **New project** anlegen:
   - Name: z.B. `daily-life-dash`
   - Datenbank-Passwort: eins ausdenken und sichern (brauchst du selten).
   - Region: „Central EU (Frankfurt)“.
3. Warte ~2 Minuten, bis das Projekt bereit ist.
4. **Schema anlegen**: Links **SQL Editor** → „New query“ → kompletten Inhalt von
   `supabase/schema.sql` einfügen → **Run**. Sollte „Success“ zeigen — legt die Tabelle
   `dashboards` inkl. Row-Level-Security an.
5. **Die zwei Werte holen** (Settings → API):
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon / public key**
   Der anon-Key darf öffentlich sein — die Sicherheit kommt aus den RLS-Regeln in der
   Datenbank, nicht aus Geheimhaltung des Keys.
6. **Redirect-URL erlauben**: Authentication → URL Configuration → bei „Redirect URLs“
   deine spätere GitHub-Pages-URL eintragen, z.B.
   `https://DEINNAME.github.io/daily-life-dash/`. Ohne diesen Schritt lehnt Supabase den
   Magic-Link-Redirect ab.
7. Login-Mails (Authentication → Providers → „Email“) sind standardmäßig aktiv — nichts
   weiter zu tun.

## 2. GitHub Pages aktivieren

1. Im Repo auf GitHub: **Settings → Pages**.
2. Bei „Build and deployment“ → **Source: GitHub Actions** auswählen. (Der Workflow
   `.github/workflows/deploy.yml` ist schon da und baut/deployt automatisch bei jedem
   Push auf `main`.)

## 3. Die zwei Supabase-Werte als GitHub-Secrets hinterlegen

Damit der automatische Build sie einbacken kann, ohne dass sie im Code landen:

1. Im Repo: **Settings → Secrets and variables → Actions → New repository secret**.
2. Zwei Secrets anlegen:
   - `VITE_SUPABASE_URL` = deine Project URL
   - `VITE_SUPABASE_ANON_KEY` = dein anon-Key
3. Danach einmal den Workflow anstoßen (z.B. leeren Commit pushen, oder in „Actions“ den
   Workflow manuell über „Run workflow“ starten).

Nach ein bis zwei Minuten ist die App live unter
**`https://DEINNAME.github.io/daily-life-dash/`** — diese URL ändert sich bei künftigen
Updates nicht mehr.

## 4. Erster Login & Datenübernahme

1. Die URL öffnen, E-Mail eingeben, Magic Link abwarten und antippen.
2. Du startest mit einem leeren Dashboard (Default-Werte). Um deinen echten Stand
   (Investitionen, Chess-Elo 1028, Habits, Trainingsvorlagen, 4 Basketball-Sessions im
   Juli) zu übernehmen:
   - Öffne die Datei `supabase/seed-data.json` in diesem Repo, kopiere den kompletten
     Inhalt.
   - In der App: Tab **Erfolge → Daten-Backup → Importieren** → Text einfügen →
     „Import speichern“.
   - Prüfen: Home zeigt ~39 % beim Geld-Ziel, Chess-Elo 1028, im Training 4
     Basketball-Punkte im Juli-Kalender.
3. Ab jetzt synct jedes Gerät automatisch über dasselbe Supabase-Konto — einfach auf dem
   Handy/Laptop mit derselben E-Mail einloggen.

## 5. Aufs Handy legen

- **iPhone/Safari**: URL öffnen → einloggen → Teilen-Symbol → „Zum Home-Bildschirm“.
- **Android/Chrome**: URL öffnen → Menü (drei Punkte) → „Zur Startseite hinzufügen“.

Der Login bleibt im Browser gespeichert, du machst ihn also nur einmal pro Gerät.

## 6. Wenn mal keine Nutzung: Supabase aufwecken

Der Gratis-Plan pausiert Projekte nach ~1 Woche Inaktivität. Bei täglichem Tracken
passiert das nie. Falls doch: supabase.com öffnen, Projekt anklicken, „Restore“ — nach
ein paar Sekunden läuft alles wie vorher, Daten bleiben erhalten.

## Updates / Weiterentwicklung

Jede Änderung, die du mit Claude Code besprichst und die auf `main` gepusht wird, baut
und deployt sich automatisch über GitHub Actions. Keine manuellen Schritte nötig, die
feste URL bleibt bestehen. Deine Daten liegen in Supabase, nicht im Code — sie bleiben
bei jedem Update erhalten.

# Daily Life Dash

Persönliches Lebens-Dashboard: Finanzen/Investitionen, Sales-Ziele, Fitness (inkl.
Gewicht mit Trend), Chess-Rating, Daily Habits mit Streaks, Training (Kategorien,
Vorlagen, Kalender, Progression) und Erfolge — in einem dunklen, app-artigen Interface.

Läuft als eigenständige React-App (Vite), Login per Magic Link und Datenspeicherung
über Supabase (geräteübergreifender Sync), Hosting via GitHub Pages.

## Struktur

| Pfad | Inhalt |
|------|--------|
| `src/App.jsx` | Auth-Gate: zeigt Login oder das Dashboard |
| `src/components/Login.jsx` | Magic-Link-Login |
| `src/components/DailyLifeDash.jsx` | Die eigentliche App (Home, Geld, Sales, Fitness, Chess, Training, Erfolge) |
| `src/lib/supabaseClient.js` | Supabase-Client, liest `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` aus der Umgebung |
| `supabase/schema.sql` | DB-Schema (eine Tabelle `dashboards`, JSONB pro Nutzer, Row Level Security) |
| `docs/SETUP.md` | Klick-Anleitung für Supabase, GitHub Pages und Homescreen |
| `.github/workflows/deploy.yml` | Baut die App und deployt sie automatisch auf GitHub Pages bei jedem Push auf `main` |

## Lokal entwickeln

```bash
npm install
cp .env.example .env   # echte Supabase-Werte eintragen
npm run dev
```

## Update ausrollen

Datei ändern → committen → auf `main` pushen. GitHub Actions baut die App automatisch
und deployt sie auf GitHub Pages. Die App-URL bleibt dabei immer gleich.

## Daten-Sync

Der komplette App-Zustand ist EIN JSON-Objekt, das in Supabase (Tabelle `dashboards`,
eine Zeile pro Nutzer) liegt. Jedes Gerät lädt beim Öffnen den aktuellen Stand und
speichert Änderungen automatisch (debounced, ~600ms). Fällt die Verbindung aus, wird
der letzte bekannte Stand aus dem Browser-Cache angezeigt und beim nächsten
erfolgreichen Speichern synchronisiert. Zusätzlich gibt es im Tab „Erfolge“ eine
manuelle Export/Import-Funktion als Backup-Netz.

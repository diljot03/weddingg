# Wedding Guest Companion (PWA)

A mobile-first wedding invitation and guest app. Guests can view the itinerary, call coordinators, share and filter photos, chat, request DJ songs, sign up for the Sangeet and play games. It installs to the home screen like a native app.

Built with Next.js 16 (App Router), Tailwind CSS, Framer Motion and Lucide icons. Supabase provides the live data, sign-in and file storage.

## 0. Open it instantly (no install)

`wedding-app.html` is the whole app in one file. Double-click it to open in Chrome, Edge, Safari or Firefox. It runs in demo mode, so data stays in that browser. Rebuild it after changes with `npm run standalone`, which writes `dist/wedding-app.html`.

## 1. Try it locally (demo mode, no backend)

```bash
npm install
npm run dev        # open http://localhost:3000
```

With no Supabase keys the app runs in **demo mode**. Data is stored in the browser and syncs between tabs of that browser only. Enter invite code `HOST2027` on the sign-in screen to unlock the host tools.

## 2. Connect Supabase (real, shared data)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste all of `supabase/schema.sql` and run it.
3. Change the host code. The last statement in the schema sets it, or run:
   `update app_secrets set value = 'YOUR-SECRET' where key = 'host_code';`
   Give this code only to the couple and organisers.
4. Turn on **Authentication → Sign In / Providers → Anonymous sign-ins**. Guests sign in with just a name, and this setting is what allows that.
5. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

## 3. Deploy

**Vercel:** import the repo, add the two `NEXT_PUBLIC_SUPABASE_*` variables and deploy. No other configuration is needed.

**Netlify:** import the repo and add the same variables. `netlify.toml` is already included.

The site must be served over HTTPS (both hosts do this) for the install button and service worker to work.

## 4. Make it yours

Sign in with the host code and tap **Host** (top-left of the cover photo) to open the Host Studio:

- **Theme:** colour palette (Royal Maroon, Mughal Emerald, Haldi Marigold, Rose Blush, Sangeet Midnight), script, heading and body fonts, and the background motif.
- **Invitation:** names, tagline, wedding date (drives the countdown), cover and Polaroid photos, and the parents' names.
- **Events:** each function's time, venue, map pin, note and call buttons.
- **Logistics:** shuttle timings and driver contacts.
- **Games:** trivia questions and polls.

Changes reach every guest instantly. The starting content lives in `lib/defaults.ts`. Also update the app name in `public/manifest.json` and `app/layout.tsx`, and replace the icons in `public/icons/`.

Hosts can also post announcements (Chat tab), mark songs as played, update Sangeet act status and play guests' backing tracks, and delete any photo, message or request.

## How the features work

| Feature | Notes |
| --- | --- |
| Sign-in | Each guest gets an anonymous Supabase session. Signing out removes them from the guest list. The host role can only be granted by the `claim_host` database function. |
| My photos | Shows photos the guest uploaded, plus photos their face appears in. Face matching runs on the phone (`@vladmandic/face-api`, models loaded from jsDelivr). Only face measurements are stored, never sent to a third party. Guests turn it on with **Scan selfie**. |
| Song search | `/api/songs` searches Apple's public iTunes catalogue on the server and returns title, artist and artwork. Guests can also type any song. |
| Downloads | Photo downloads use Supabase's `?download=` link so they save instead of opening. |
| Offline | The service worker caches the app shell, fonts and icons. Live data (chat, photos) needs a connection. |
| Time zone | Event times are entered and shown in India Standard Time (see `lib/format.ts` and `components/HostStudio.tsx` to change). |

## Project layout

```
app/                 layout, page shell, /api/songs route
components/          Cover (hero, countdown, invitation), TabBar, Onboarding,
                     HostStudio, InstallBanner, tabs/*
lib/db.ts            data layer: Supabase + realtime, or local demo store
lib/app.tsx          session, settings, theme, toasts
lib/themes.ts        palettes and fonts
lib/defaults.ts      starting wedding content
supabase/schema.sql  tables, access rules, realtime, storage bucket
public/              manifest, service worker, icons, placeholder portrait
```

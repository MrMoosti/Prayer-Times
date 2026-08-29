# Mektep Prayer

A 1920×1080 prayer-times display: today's times, kerahat windows and a live
countdown, over a claymorphic landscape that follows the real sun, moon and
weather for the configured city.

![Midday](docs/midday.webp)

| | |
| --- | --- |
| ![Sunset](docs/sunset.webp) | ![Night](docs/night.webp) |
| ![Thunderstorm](docs/thunder.webp) | |

Built with Next.js (App Router) and no UI framework — the clay look is a small
set of CSS custom properties and shadows in `app/globals.css`.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

That is the whole setup. No API keys, no accounts, no environment variables:
both upstream services are keyless, and if neither can be reached the app falls
back to calculating the times itself and says so on screen.

```bash
npm run build && npm start   # production
npm run typecheck            # tsc --noEmit
npm run scene                # re-render the artwork (see "Artwork")
```

Point a browser at it full-screen on a 16:9 display and it is a wall panel. The
layout is authored at 1920×1080 and scales as one piece to any resolution;
below 1000px wide it stacks into a phone layout.

## Where the data comes from

| What | Source | Notes |
| --- | --- | --- |
| Prayer times | [Aladhan](https://aladhan.com/prayer-times-api) `/calendar/{year}?annual=true` | Keyless. Method 13 is Diyanet İşleri Başkanlığı, the default. |
| Weather | [Open-Meteo](https://open-meteo.com) `/v1/forecast` | Keyless. Current conditions, WMO code. |
| City search | Open-Meteo geocoding | Keyless. Falls back to a bundled list of ~28 cities offline. |

**The yearly calendar is fetched once.** One request covers all 365 days for a
location; the response is cached on disk under `.cache/prayer/` and reused for
the rest of the year. Changing the location or the calculation method fetches a
new year; changing an offset does not, because offsets are applied client-side.

Both upstream base URLs can be overridden if you proxy them:

```bash
ALADHAN_BASE_URL=https://api.aladhan.com/v1
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1
OPEN_METEO_GEOCODING_URL=https://geocoding-api.open-meteo.com/v1
```

### If Aladhan cannot be reached

`lib/solar.ts` computes the year locally from the sun's position, using the
Diyanet angles (Fajr 18°, Isha 17°, Asr shadow factor 1). The header notice says
`Offline — times calculated locally` whenever this is what you are looking at,
and the app retries the API on the next load. Spot-checked against published
tables it lands within a couple of minutes at Istanbul, Mecca, Jakarta and
Rijswijk.

Above roughly 48° latitude the sun never dips 18° below the horizon in
midsummer, so Fajr and Isha have no astronomical time — and for weeks either
side of that, the time it does have is minutes from solar midnight and unusable.
Both cases fall back to a fixed portion of the night (one seventh by default,
configurable in settings, matching Aladhan's `latitudeAdjustmentMethod`). The
rule only engages when a time is genuinely missing or lands within an eighth of
the night of solar midnight, so it leaves correct mid-latitude times alone.

### Swapping in the official Diyanet API

`lib/calendar-source.ts` has one function that talks to the network,
`fetchFromAladhan`, returning a `YearlyCalendar`. Write a second one against
`namazvakitleri.diyanet.gov.tr` (it needs an account and a bearer token) and
call it first in `getYearlyCalendar`; nothing else in the app changes.

## Settings

The gear at the top right opens a drawer. Everything is stored in
`localStorage` — there is no account and nothing leaves the browser.

- **Location** — city search, or the browser's geolocation. Drives prayer
  times, weather, and where the sun and moon sit in the sky.
- **Calculation method** — eight of Aladhan's methods; Diyanet is the default.
- **High latitude rule** — see above.
- **Time offsets** — ±60 minutes per prayer. This shifts the displayed time and
  delays the announcement with it, so `+5` on Dhuhr calls it five minutes after
  the calculated time.
- **Announcements** — desktop notifications, plus the per-prayer speaker
  toggles on each row.
- **Appearance** — follow the sun / force day / force night, 24-hour clock,
  weather on or off, and a reduce-motion switch that parks the animation.

## The call to prayer

The speaker on each prayer row toggles that prayer's announcement;
**shift-click it to hear the tone immediately** without waiting for the time.
When a prayer arrives the screen takes over with the prayer's name and the tone
plays. Browsers refuse to play audio before the page is interacted with, so the
**Enable prayer notifications** button on the countdown card unlocks it — press
it once when you set the display up.

The tone is synthesised in `lib/adhan.ts` (struck-bell partials arranged in
Hijaz), so no audio ships with the app. To use a real recording, drop
`adhan.mp3` into `public/audio/` — or `adhan-fajr.mp3` for a per-prayer call.
It is picked up on the next load with no configuration.

## The scene

`components/scene/SceneBackground.tsx` draws it, and everything in it is
driven by real values rather than a time-of-day preset:

- **Palette** — every colour token is a continuous function of the sun's
  altitude (`lib/sky.ts`), interpolated between keyframes, so the page drifts
  from night through dawn to day with no visible switch. Dawn runs cool and
  pink, dusk runs amber.
- **Sun and moon** — placed from real altitude and azimuth for the location.
  The moon carries its actual phase, carved out of the disc with a CSS mask.
  Both set behind the hills. The vertical arc is compressed into the strip of
  sky above the cards; the horizontal arc is centred right of screen centre to
  clear the logo.
- **Weather** — the WMO code from Open-Meteo picks cloud density, rain, sleet,
  snow, fog, and the lightning flash, and mutes the palette
  (`lib/weather.ts`). Clouds drift on independent slow loops.

## Artwork

The layers in `public/scene/` are transparent WebP, generated from SVG authored
in `scripts/scene-art.mjs`:

```bash
npm run scene    # writes assets/scene/*.svg and public/scene/*.webp
```

The generated files are committed, so a fresh clone runs without this step —
re-run it after editing the art. To use your own renders instead, drop
replacements into `public/scene/` under the same names; the scene component only
knows about the filenames.

## Layout

```
app/
  api/prayer-times/   yearly calendar, disk-cached
  api/weather/        current conditions, 10-minute memory cache
  api/geocode/        city search with an offline fallback
  api/audio/          lists any adhan recordings you added
  globals.css         clay design system
  scene.css           the background and its animations
components/           header, cards, nav, settings drawer, scene
lib/
  solar.ts            sun/moon position; offline prayer calculation
  sky.ts              altitude → palette
  prayer.ts           schedule, current/next prayer, kerahat windows
  time.ts             timezone-correct conversion and formatting
  calendar-source.ts  Aladhan client, cache, local fallback
scripts/              the artwork and its build
```

## Known gaps

- The bottom nav's Prayer, Program, Community and Account tabs are placeholders.
  Only Home is built.
- Kerahat windows use the conventional 45 minutes; there is no setting for it.
- Verse of the day rotates through 14 verses by day number.

# Adhan audio

Empty by default: the app synthesises its call tone, so no audio ships with it.

To use a real recording, drop a file in this folder:

- `adhan.mp3` — used for every prayer
- `adhan-fajr.mp3` — used for Fajr only (same pattern for `dhuhr`, `asr`,
  `maghrib`, `isha`); a per-prayer file wins over `adhan.mp3`

`.ogg`, `.m4a` and `.wav` work too. Nothing else to configure — `/api/audio`
reports what is here and the player picks it up on the next load.

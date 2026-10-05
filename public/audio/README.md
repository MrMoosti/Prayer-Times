# Adhan audio

`adhan.mp3` ships with the app. To use a different recording, replace it or add
files in this folder:

- `adhan.mp3` — used for every prayer (included)
- `adhan-fajr.mp3` — used for Fajr only (same pattern for `dhuhr`, `asr`,
  `maghrib`, `isha`); a per-prayer file wins over `adhan.mp3`

`.ogg`, `.m4a` and `.wav` work too. Nothing else to configure — `/api/audio`
reports what is here and the player picks it up on the next load.

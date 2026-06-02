# Simple Tracker

A clean, local-only numeric tracking app for iOS built with Expo.

Track anything — weight, sleep, steps, spending — with a simple chart and no account required.

## Features

- **Two tracker types** — Number (weight, sleep, steps, spending) or Yes/No
  (medication, habits, period days)
- **Daily or weekly cadence** — one entry per day or per week, set at creation.
  Logging again in the same period prompts to replace/change the entry
- **Custom name, unit, and color** per tracker; editable after creation
  (type and cadence are locked once set)
- **Charts** with 5 time ranges (24H · 7D · 1M · 1Y · All):
  - Number trackers → smooth line chart, whole-number axis floored at zero
  - Yes/No trackers → dot grid (filled = yes, muted = no, gray = no entry)
- **Stats** — Number: entries, latest, average · Yes/No: total yes, yes-rate, streak
- **Compare** — overlay up to 3 trackers on one chart with a shared value axis;
  Yes/No trackers render as dot strips below
- **100% local** — no server, no account, no data leaves your phone

## Tech Stack

- Expo SDK 54 / React Native 0.81.5
- TypeScript strict mode
- AsyncStorage (local persistence)
- react-native-svg (charts)
- React Navigation (native stack)

## Getting Started

```bash
npm install
npx expo start
```

Scan the QR code with [Expo Go](https://expo.dev/go) on your iOS device.

## Testing

```bash
npm test
```

Jest (jest-expo) covers the logic layer: time-range filtering and bucketing,
daily/weekly period boundaries, stats (average, yes-rate, streak), and the
AsyncStorage CRUD + migration layer. 48 tests, 100% coverage on `src/utils`.

## Status

Early development — features and design subject to change.

---

## Support

If you run into a bug, have a question, or want to suggest a feature, open an issue in this repository:

👉 **https://github.com/peteht/simple-tracker/issues/new**

Please include what device you're using, what you expected to happen, and what actually happened.

---

## Privacy Policy

Simple Tracker does not collect, store, or transmit any personal data.

- All tracker data and entries are stored locally on your device only and never leave it.
- The app does not use analytics, advertising, or third-party tracking of any kind.
- The app does not require an account or any personal information to use.

If you have questions, open an issue: https://github.com/peteht/simple-tracker/issues/new

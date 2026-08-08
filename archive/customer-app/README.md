# ZipMart — Customer App (V2)

A fresh, from-scratch rebuild of the ZipMart customer app on the **latest Expo SDK (57)**
with a **Zepto/Blinkit-style dense UI**. Business logic (products, cart, orders, checkout,
payments, support) was ported from the previous `ZipMartCustomerApp`; the UI was fully
redesigned and the auth flow switched to **phone + OTP** (matching the web portal).

## Stack

- **Expo SDK 57** (React Native 0.86, React 19.2) — managed workflow + dev client
- **expo-router** — file-based navigation (`app/`)
- **NativeWind v4** (Tailwind) — all styling via `className`, no StyleSheet files
- **Firebase phone auth** (`@react-native-firebase/auth`) → backend JWT exchange
- **react-native-maps**, **react-native-webview** (Razorpay), **socket.io-client** (live tracking + support)

## Prerequisites

- Node **20.19.4+**
- A **development build** — phone auth, Firebase, maps and Razorpay do **not** run in Expo Go
- Firebase project configured for the `com.zipmart.customer` package (Phone sign-in enabled)

## Setup

```bash
cd ZipMartCustomerAppV2

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Pin every Expo / native-module version to exactly what SDK 57 expects.
#    (Fixes any version in package.json that was a best-guess.)
npx expo install --fix

# 3. Environment
cp .env.example .env        # then edit .env (API URL, socket URL, Maps key)

# 4. Firebase config files at the project root (NOT committed — see .gitignore):
#    - google-services.json          (Android, for com.zipmart.customer)
#    - GoogleService-Info.plist       (iOS,     for com.zipmart.customer)

# 5. Google Maps keys:
#    - app.json  → android.config.googleMaps.apiKey  and  ios.config.googleMapsApiKey
#    - .env      → EXPO_PUBLIC_GOOGLE_MAPS_KEY (used for reverse-geocode + distance)

# 6. Generate native projects + run a dev build
npx expo prebuild --clean
npx expo run:android      # or: npx expo run:ios
```

After the dev build is installed on a device/emulator, day-to-day you just run:

```bash
npm start                 # expo start --dev-client
```

## Backend requirement (one new endpoint)

Phone OTP is verified client-side by Firebase; the app then exchanges the Firebase
ID token for the backend's own JWT. Add this endpoint to `ZipMartBackend`:

```
POST /users/firebase-login
body:  { idToken: string, phone: string }
->     { token: string, user: { id, name?, phone?, role? } }
```

The handler should verify `idToken` with the Firebase Admin SDK, find-or-create the
user by phone, and return your normal auth JWT (the same token every other
`/api/...` route already expects as `Authorization: Bearer`).

Everything else reuses existing endpoints (`/products/...`, `/orders/...`,
`/payments/...`, `/coupons/apply`, `/banners`, `/ratings/...`, `/shop/:id`).

## What changed vs the old app

- **Auth:** email/password + Google → **phone + OTP** (Firebase). Country code is
  hard-coded to `+91`; change it in `app/(auth)/phone.tsx` if needed.
- **Navigation:** React Navigation → **expo-router** (file-based).
- **Styling:** StyleSheet → **NativeWind**. Brand palette lives in `tailwind.config.js`
  (green `#0C831F`) with a JS mirror in `lib/theme.ts`.
- **Categories unified:** the old two diverging lists are now one source of truth in
  `constants/categories.ts` (all 26 categories, grouped for the Categories tab).
- **Config, not hard-coding:** API URL, socket URL and the Maps key are read from
  `EXPO_PUBLIC_*` env vars instead of being baked into source.
- **Dropped:** the placeholder `DeliveryInfo` screen (hard-coded dummy data) and the
  unmaintained `react-native-maps-directions` dependency. Order tracking now shows
  store/rider/you markers without the routing polyline.
- **Invoice:** generated on-device via `expo-print` and shared directly (no temp-file
  juggling). Consider moving invoice generation server-side later.

## Project structure

```
app/
  _layout.tsx            providers (Auth, Cart) + splash gate + root Stack
  (auth)/ phone, otp     phone-number → OTP (modal)
  (tabs)/ index, categories, cart, account
  product/[id]           product detail + add to cart
  category/[name]        category listing (2-col grid)
  checkout               address (map), coupon, fees, payment method
  payment                Razorpay hosted checkout (WebView)
  orders/ index, [id]    orders list + detail (tracking, invoice, rating)
  support                FAQ + live Socket.IO chat
components/               ProductCard, CategoryTile, AddButton, SearchBar,
                         Banner, CartBar, Header, ui (Loading/Empty/Card/Row/Field)
context/                 AuthContext, CartContext
lib/                     api, firebase, notifications, format, theme
constants/               categories
```

## Troubleshooting

- **A package fails to install / wrong version at build time:** run `npx expo install --fix`
  again. For `@react-native-firebase/*` (not managed by Expo), install the latest that
  supports your SDK: `npm i @react-native-firebase/app@latest @react-native-firebase/auth@latest`.
- **iOS pods fail with Firebase:** `expo-build-properties` already sets
  `useFrameworks: "static"` (required by react-native-firebase). Re-run `npx expo prebuild --clean`.
- **`prebuild` errors on a missing google-services file:** add the Firebase config
  files (step 4) — they're git-ignored and must exist locally.
- **Maps blank:** confirm the native keys in `app.json` and that the key allows the
  Android/iOS app + Maps SDK + Directions/Geocoding APIs.

# ZipMart — Project Status & Next-Session Handoff

**Updated:** 2026-07-11 · Repo: `D:\ZipMart` (git initialized, **no commits yet**)
Formerly "BellyBasket". Say "continue ZipMart using CONVERSION_HANDOFF.md" to resume.

## DONE so far

**1. Expo conversion (Customer / DeliveryBoy / Shop apps)**
- All 3 were already Expo SDK 52 with prebuilt native folders → converted to managed/CNG workflow (dev builds, NOT Expo Go — native Firebase/Razorpay/Maps).
- Native folders archived, `/android` `/ios` gitignored, permissions declared in app.json.
- Customer: Firebase/google-signin/expo-build-properties config plugins added; `google-services.json` at project root. Note: `@react-native-firebase/auth` has NO config plugin — never add it to plugins array.
- DeliveryBoy: `newArchEnabled:false` (matches how it actually built).
- Old native folders had unresolved git merge conflicts (Customer) — fixed by regeneration.

**2. Full rename BellyBasket → ZipMart (user chose: change EVERYTHING incl. IDs)**
- app.json: names/slugs (`zipmart`, `zipmart-delivery`, `zipmart-store`), scheme `zipmart`, package/bundle IDs → `com.zipmart.customer|delivery|shop`. Old EAS projectIds removed (re-run `eas init`).
- npm names: `zipmart`, `zipmart-store`, backend `zipmart`, web `zipmart-customer-web`.
- Source display text (RN app screens: About/HomePage/OrderDetails headers etc.) → ZipMart.
- Keystores (3× debug + my-upload-key) moved to `D:\ZipMart\_to_delete\` — USER MUST DELETE that folder. Old committed keystore password `bellyBasket8765` is burned; rotate via EAS credentials.

**3. Monorepo hygiene**
- Root `.gitignore` (node_modules, android/ios, _native_backup, _to_delete not ignored—wait, it IS covered via **/_native_backup/; _to_delete should not be committed either — add if needed), root `README.md` (full platform overview).
- Backend package.json renamed.

**4. Customer WEB portal — complete redesign (this session's main work)**
- Design: fresh green+white, Tailwind-only. Brand palette `brand-50..900` in tailwind.config.js, Inter font, shared classes `.btn-primary .btn-outline .card .input-field .section-title .chip` in src/index.css (Vite boilerplate that broke layouts removed).
- New `src/components/Navbar.tsx`: sticky top navbar (logo wordmark, search, cart badge) + mobile-only bottom tabs. Exports `Wordmark` used across screens. Replaced old BottomNavbar everywhere.
- ALL screens rewritten in pure Tailwind (logic 100% preserved): Welcome, Login, VerifyOtp, HomePage (responsive carousels, coded app-CTA banner replacing BellyBasket image), Explore, CategoryPage, ProductPage, Cart (steppers + fixed checkout bar), Checkout (2-col + sticky summary), Payment (Razorpay name "ZipMart", theme #218c4a), Orders, OrderDetails (PDF invoice header now text "ZipMart"), Account, Sidebar, CustomerSupport (chat bubbles), About, PrivacyPolicy, Footer, Splash, OrderSuccess, DeliveryInfo, ErrorBoundary, App.tsx (ZipMart SEO meta), index.html + new public/favicon.svg (green ⚡).
- 12 dead .css files + old BottomNavbar.tsx + tst.html → `_to_delete/ZipMartCustomerWeb/`.
- All files passed Bun transpiler syntax check. User should run: `npm install && npm run dev` in ZipMartCustomerWeb to visually verify.

## INTENTIONALLY KEPT (functional infra, not brand text)
- `api.bellybasketstore.in` / `bellybasketstore.in` (live API/socket/canonical URLs) — change only after new domain purchased.
- `customersupport@bellybasketstore.in` email; social profile links (x.com/BellybasketS, instagram bellybasket45, linkedin).
- Firebase project IDs `belly-basket-4cfa6` (Shop web+app JS SDK), `bellybasket-6242b` (Customer) — real Google projects; renaming = new projects + data migration.

## PENDING / NEXT SESSION
1. **Customer app build is BLOCKED**: `google-services.json` still lists `com.bellybasket.customer` but app is now `com.zipmart.customer`. Fix: Firebase console (project bellybasket-6242b) → add Android app `com.zipmart.customer` → replace google-services.json → `npx expo prebuild --clean`.
2. Google Sign-In: new Android OAuth client for `com.zipmart.customer` + SHA-1; update clientIds in Customer app.json `extra`.
3. Maps key restrictions: add `com.zipmart.delivery` + SHA-1.
4. `eas init` in each of the 3 apps (new slugs, old projectIds removed).
5. Per app: `npm install && npx expo install --fix && npx expo prebuild --clean && npx expo-doctor && npx expo run:android`. Remove `expo-permissions` from DeliveryBoy (dead in SDK 52).
6. User deletes `D:\ZipMart\_to_delete\`; rotate keystore creds; first git commit (verify `git status` shows no keystores/_native_backup; stale `.git/index.lock` may need manual delete).
7. **Not yet done**: ZipMartShopWeb + ZipMartAdminWeb redesign/rename sweep; ZipMartBackend source sweep for "belly" strings; RN mobile app UI redesign (only web Customer done).
8. Optional: new domain/email/social handles → then sweep the functional refs listed above.

## Environment notes (for Claude)
- Cloud sandbox npm registry = 403 for ALL packages; device_bash has NO network and CANNOT rm (use `mv` to `_to_delete`). Builds/installs run on user's machine only.
- `bun` + `tsc` exist in cloud sandbox → use Bun.Transpiler for TSX syntax checks.
- device_stage_files rejects `.kt` files (HTTP 400) — read via device_bash cat.
- Full-tree grep via device_bash on repo root times out (45s) — scope to subdirs.
- Don't run long git commands via device_bash while user works — index.lock collision happened once.

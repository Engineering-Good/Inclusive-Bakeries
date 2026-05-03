# Agent Instructions: Inclusive Baker App

## Project Overview

React Native (Expo SDK 53) app for accessible baking via Bluetooth kitchen scale integration. Targets **Android** and **Web** only. App name: "Help Me Weigh" (package `helpmeweigh`).

## Quick Start

```bash
npm install
npx expo start        # interactive menu; press 'w' for web, 'a' for Android
npm run web           # shortcut to web at http://localhost:19006
npm run android       # local Android build via expo run:android
```

- **Web dev**: `npx expo start` then press `w`.
- **Android dev build** (full BLE/native): requires EAS CLI and a physical device. Expo Go does **not** support native Bluetooth.
- **Prebuild** (generate `android/` / `ios/`): `npx expo prebuild`.

## Tech Stack & Key Dependencies

- Expo SDK `~53.0.12`, React Native `0.79.4`, React `19.0.0`
- Navigation: `@react-navigation/native` + `native-stack`
- UI: `react-native-paper` (Material Design)
- BLE: `react-native-ble-plx` (via `expo-build-properties` plugin)
- Speech: `expo-speech`
- Storage: `@react-native-async-storage/async-storage`
- Image picker: `expo-image-picker`
- State persistence hook: `react-native-mmkv` (used in `useNavigationSafety`)

## Project Structure

```
App.js                 # Entry point; sets up PaperProvider + NavigationContainer
index.js               # registerRootComponent(App)
src/
  screens/             # RecipeList, RecipeDetail, Ingredient, EditRecipe,
                       # Settings, Instructor, Celebration
  components/          # IngredientColumns, ScaleDisplayComponent,
                       # ScaleConnectButton, MockScaleComponent
  services/            # RecipeService, SpeechService, ScaleServiceFactory,
                       # BluetoothScaleService, EtekcityBluetoothService,
                       # LefuScaleService, MockScaleService, EventEmitterService
  hooks/               # useWeighingWorkflow (primary), useNavigationSafety,
                       # useUIState, plus legacy hooks (useWeighingFlow,
                       # useScaleSubscription, useSpeechManagement, etc.)
  constants/           # theme.js, speechText.js, ScaleServices.js
  data/                # sampleRecipes.js, ingredientDatabase.js
  utils/permissions/   # bluetooth.ts (Android BLE permission requests)
modules/
  lefu-scale/          # Expo native module for Lefu scale (Android AARs)
android/               # Prebuilt native project (managed by Expo)
assets/                # Images, fonts, static files
```

## Architecture Notes

### Scale Abstraction
- `ScaleServiceFactory` is a **static singleton** that selects and manages the active scale backend.
- Supported scales: `MOCK`, `ETEKCITY`, `BLUETOOTH`, `LEFU`.
- Selection is persisted in AsyncStorage under key `selectedScale`. Default is `MOCK`.
- `ScaleServiceFactory` exposes:
  - `getScaleService()` — returns the active scale service instance.
  - `connectToScale()` / `disconnectFromScale()`
  - `subscribeToWeightUpdates(callback)` — returns an unsubscribe function.
  - `subscribeToConnectionStatus(callback)`
  - `isMockScaleSelected()`
- All scale services implement `ScaleInterface` (startScan, stopScan, connect, disconnect, readWeight).
- **Mock scale** (`MockScaleService`) is the default and provides manual weight-change buttons when active.

### Speech System
- `SpeechService` is a **singleton** with an internal queue.
- It supports configurable delay, rate, preferred voice, and word-by-word mode.
- Settings are persisted in AsyncStorage.
- **Interruption pattern**: always call `SpeechService.stop()` before `SpeechService.speak(text, { immediate: true })` to avoid overlap.
- `SpeechService.waitUntilDone()` polls `Speech.isSpeakingAsync()` with a 10s safety timeout.

### Recipe Data Flow
- `RecipeService` is a static class that reads/writes recipes to AsyncStorage under key `app_recipes`.
- On first launch it seeds `sampleRecipes`.
- `rehydrateRecipeImages()` merges stored recipes with sample data to restore local asset references (since `require()` outputs can’t be serialized).
- `EditRecipeScreen` and `InstructorScreen` both save via `RecipeService.saveRecipes()` or `saveRecipe()`.

### IngredientScreen Hook Composition
- The active implementation uses **`useWeighingWorkflow`** (consolidates scale subscription, weighing logic, speech messages, and color states).
- Supporting hooks:
  - `useNavigationSafety` — AppState + focus effect handling with MMKV persistence.
  - `useUIState` — dialog visibility and button-debounce flags.
- **Legacy hooks exist but are not currently used by `IngredientScreen`**: `useWeighingFlow`, `useScaleSubscription`, `useSpeechManagement`, `useIngredientStep`, `useSpeech`, `useScale`, `useWeighingLogic`, `useSpeechLogic`. They were created during a refactor and may be referenced or partially imported; verify imports before deleting.

## Important Conventions

### Path Aliases
- `@components/*` → `src/components/*`
- `@utils/*` → `src/utils/*`
- `@modules/*` → `modules/*`
- Configured in both `babel.config.js` (`module-resolver` plugin) and `tsconfig.json`.

### Environment Variables
- `LEFU_API_KEY` and `LEFU_API_SECRET` are required for the Lefu scale module.
- Loaded via `app.config.js` using `dotenv/config`. The root `.env` file is present but **contains real credentials** — do not commit changes to it.
- Template: `.env.template`.

### Ingredient `stepType`
- `weight` — exact mass target with tolerance (grams). Uses scale.
- `weighable` — place item on scale, no exact target (e.g., eggs). Uses scale but with a lower threshold (`currentWeight > 1`).
- Non-scale steps (e.g., mixing) are handled as `weighable` or skipped depending on UI context.

### ScaleDisplayComponent Lifecycle
- On mount it auto-attempts `ScaleServiceFactory.connectToScale()` if not already connected.
- Subscribes to `EventEmitterService` for `connectionStatus` and `weightUpdate`.
- On unmount it calls `ScaleServiceFactory.unsubscribeAll()` and `SpeechService.stop()`.
- **Tare handling**: if `requireTare` is true and weight > 0, it speaks `SCALE_MESSAGES.TARE_NEEDED` and blocks passing weight to parent until `isTare` flag is received.

## EAS / Build Notes

- `eas.json` defines `development`, `preview`, and `production` profiles.
- `app.json` sets `owner: "jmjadenjm"`, `extra.eas.projectId`, and `updates.url`.
- For a new developer/EAS project, `eas init` may fail if `projectId` exists in `app.config.js`; remove it temporarily and rerun.
- EAS env variables for Lefu credentials should be created with:
  ```bash
  eas env:create --name LEFU_API_KEY --value <key> --environment development --visibility sensitive
  eas env:create --name LEFU_API_SECRET --value <secret> --environment development --visibility sensitive
  ```

## Testing / Verification

- There is **no test runner configured** (no Jest, no test scripts in `package.json`).
- Manual verification checklist after changes:
  1. Web build: `npm run web` — check RecipeList → RecipeDetail → Ingredient flow.
  2. Mock scale: select Mock in Settings, verify weight changes and speech prompts.
  3. IngredientScreen: confirm tare → weighing → completion → navigation to next ingredient or Celebration.
  4. EditRecipe: create/save recipe, verify image handling and unsaved-changes dialog.

## Common Pitfalls

- **Do not run `npm audit fix --force`** — it breaks dependency resolution (documented in `GettingStarted.md`).
- **Expo Go cannot use BLE** — use a development build (`eas build --profile development --platform android`) for scale testing.
- **Image URIs**: stored recipes may have string URIs (URLs/base64) or `require()` outputs. `RecipeService.rehydrateRecipeImages()` and `getImageSource()` helpers normalize these. Do not assume `imageUri` is always a string.
- **Speech queue**: `SpeechService.speak()` is asynchronous but queues internally. For immediate interruption, pass `{ immediate: true }` or call `SpeechService.stop()` first.
- **ScaleServiceFactory static state**: `services`, `currentDevice`, and `isConnected` are static properties. Reset with `ScaleServiceFactory.resetServices()` if needed during testing.
- **Lefu native module**: located in `modules/lefu-scale/`. It depends on two AARs (`ppbasekit`, `ppbluetoothkit`) referenced in `expo-module.config.json` and `android/build.gradle`. Do not modify AAR paths without updating both files.

## Related Docs

- `README.md` — setup, platforms, project structure.
- `GettingStarted.md` — detailed Windows/Linux/WSL2 setup, EAS build steps, known issues.
- `REFACTORING_PLAN.md` — original plan for IngredientScreen hook decomposition (partially implemented; current state uses `useWeighingWorkflow`).
- `.kilo/plans/` — additional agent plans (check for active work before large refactors).

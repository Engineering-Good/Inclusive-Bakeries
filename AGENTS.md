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
- State persistence hook: `react-native-mmkv` (used in `useAppState`)

## Project Structure

```
App.js                 # Entry point; sets up PaperProvider + NavigationContainer
index.js               # registerRootComponent(App)
src/
  screens/             # RecipeList, RecipeDetail, Ingredient, EditRecipe,
                       # Settings, Instructor, Celebration
  screens/             # ~200 lines each, pure presentation
  IngredientScreen.styles.js  # Extracted styles for IngredientScreen
  components/          # IngredientColumns, ScaleDisplayComponent,
                       # ScaleConnectButton, MockScaleComponent,
                       # ConfirmationDialog (extracted from IngredientScreen)
  services/            # RecipeService, SpeechService, ScaleServiceFactory,
                       # BluetoothScaleService, EtekcityBluetoothService,
                       # LefuScaleService, MockScaleService, EventEmitterService
  hooks/
    # Orchestration
    useIngredientWeighing.js    # Composes scale + calc + speech
    useRecipeProgress.js        # Navigation & multi-step progress tracking
    # Domain Logic
    useScaleConnection.js       # Scale subscription, debouncing, connection state
    useWeightCalculations.js    # Pure computation: tolerance, progress, color
    useIngredientSpeech.js      # Speech queue, interruption, replay timer
    # Cross-cutting
    useAppState.js              # AppState listener + MMKV persistence
    useUIState.js               # Dialog flags, button debouncing
    usePulseAnimation.js        # Animated pulse on weight reached
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
- The active implementation uses **`useIngredientWeighing`** (consolidates scale subscription, weighing logic, speech messages, and color states).
- Supporting hooks:
  - `useAppState` — AppState + focus effect handling with MMKV persistence.
  - `useUIState` — dialog visibility and button-debounce flags.
  - `useRecipeProgress` — navigation logic, completed-indices tracking, next/celebration routing.
  - `usePulseAnimation` — `Animated.loop` pulse on weight-reached state.
- **Internal composition**: `useIngredientWeighing` composes three domain hooks:
  1. `useScaleConnection` — BLE/mock scale subscription, weight debouncing (0.5g threshold + 300ms delay), connection status.
  2. `useWeightCalculations` — Pure-computation of `isWithinTolerance`, `isOverTolerance`, `progress`, `getBackgroundColor`.
  3. `useIngredientSpeech` — Speech queue with interruption (stop-before-speak), replay, repeat timer using `PROMPT_DELAY`.
- **ConfirmationDialog** component extracted from IngredientScreen into its own file under `components/`.
- **All legacy hooks have been removed**: `useWeighingFlow`, `useScaleSubscription`, `useSpeechManagement`, `useIngredientStep`, `useSpeech`, `useScale`, `useWeighingLogic`, `useSpeechLogic`, `useNavigationSafety`, `useWeighingWorkflow` are no longer present.

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

### Test Framework
- **Jest** configured with Expo compatibility (`jest-expo` preset alternative)
- **@testing-library/react-native** for component and hook testing
- Test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Coverage thresholds: 70% for statements, branches, functions, and lines
- Comprehensive mocks for AsyncStorage, expo-speech, react-native-ble-plx, and other native modules

### Current Test Coverage
- **RecipeService**: 91% coverage (34 tests covering all methods: initializeRecipes, getRecipes, saveRecipes, rehydrateRecipeImages, saveRecipe, getRecipeById, resetRecipesToSampleData)
- **Permissions utilities**: 100% coverage (9 tests for Bluetooth permission handling)
- Test files: `src/services/__tests__/RecipeService.test.js`, `src/utils/permissions/__tests__/bluetooth.test.js`

### Manual Verification Checklist
After changes:
1. Web build: `npm run web` — check RecipeList → RecipeDetail → Ingredient flow.
2. Mock scale: select Mock in Settings, verify weight changes and speech prompts.
3. IngredientScreen: confirm tare → weighing → completion → navigation to next ingredient or Celebration.
4. EditRecipe: create/save recipe, verify image handling and unsaved-changes dialog.
5. Tests: `npm test` — ensure all tests pass and coverage meets thresholds.

## Common Pitfalls

- **Do not run `npm audit fix --force`** — it breaks dependency resolution (documented in `GettingStarted.md`).
- **Expo Go cannot use BLE** — use a development build (`eas build --profile development --platform android`) for scale testing.
- **Image URIs**: stored recipes may have string URIs (URLs/base64) or `require()` outputs. `RecipeService.rehydrateRecipeImages()` and `getImageSource()` helpers normalize these. Do not assume `imageUri` is always a string.
- **Speech queue**: `SpeechService.speak()` is asynchronous but queues internally. For immediate interruption, pass `{ immediate: true }` or call `SpeechService.stop()` first.
- **ScaleServiceFactory static state**: `services`, `currentDevice`, and `isConnected` are static properties. Reset with `ScaleServiceFactory.resetServices()` if needed during testing.
- **Lefu native module**: located in `modules/lefu-scale/`. It depends on two AARs (`ppbasekit`, `ppbluetoothkit`) referenced in `expo-module.config.json` and `android/build.gradle`. Do not modify AAR paths without updating both files.

### Scale Subscription Rules (Critical)
- **Always subscribe via `ScaleServiceFactory.subscribeToWeightUpdates(callback)`** — NEVER call `scaleService.subscribe()` directly. The mock scale emits events through `EventEmitterService`, and only the factory bridges this correctly. Direct scale service subscriptions will not receive mock weight updates.
- **Do not duplicate weight subscriptions** — `ScaleDisplayComponent` receives `currentWeight` as a prop from `useIngredientWeighing` → `useScaleConnection`. It should NOT subscribe to weight updates for state management. It may only listen for tare and connection status events.
- **useEffect cleanup must be returned from the effect callback** — When using async initialization inside `useEffect`, the cleanup function must be returned from the outer effect callback, NOT from the inner async function. Returning cleanup from inside an async function means it never runs.
- **EventEmitterService uses Arrays, not Sets** — Listener storage uses `Array` with `push/splice` instead of `Set` with `add/delete`. This ensures `forEach` works correctly across all React Native environments.
- **Mock weight changes are stable** — `mockWeightChange()` sends `isStable: true` to trigger immediate UI updates. Real scale readings may be unstable and use debounce delays.

### Scale Subscription Rules (Critical)
- **Always subscribe via `ScaleServiceFactory.subscribeToWeightUpdates(callback)`** — NEVER call `scaleService.subscribe()` directly. The mock scale emits events through `EventEmitterService`, and only the factory bridges this correctly. Direct scale service subscriptions will not receive mock weight updates.
- **Do not duplicate weight subscriptions** — `ScaleDisplayComponent` receives `currentWeight` as a prop from `useIngredientWeighing` → `useScaleConnection`. It should NOT subscribe to weight updates for state management. It may only listen for tare and connection status events.
- **useEffect cleanup must be returned from the effect callback** — When using async initialization inside `useEffect`, the cleanup function must be returned from the outer effect callback, NOT from the inner async function. Returning cleanup from inside an async function means it never runs.
- **EventEmitterService uses Arrays, not Sets** — Listener storage uses `Array` with `push/splice` instead of `Set` with `add/delete`. This ensures `forEach` works correctly across all React Native environments.
- **Mock weight changes are stable** — `mockWeightChange()` sends `isStable: true` to trigger immediate UI updates. Real scale readings may be unstable and use debounce delays.

## Related Docs

- `README.md` — setup, platforms, project structure, architecture with hook data flow diagram.
- `GettingStarted.md` — detailed Windows/Linux/WSL2 setup, EAS build steps, known issues.
- `REFACTORING_PLAN.md` — original plan for IngredientScreen hook decomposition (partially implemented; current state uses `useIngredientWeighing`).
- `.kilo/plans/` — additional agent plans (check for active work before large refactors).

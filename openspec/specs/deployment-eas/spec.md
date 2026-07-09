# Deployment EAS Specification

## Purpose

Production-ready EAS Build configuration with deep link schemes and verified build for both iOS and Android.

## Requirements

### Requirement: Deep linking schemes

The app configuration (`app.json` or `app.config.js`) MUST define a URL scheme (e.g., `mbtrend://`) for deep linking. The scheme SHALL be registered in both iOS and Android configs.

#### Scenario: Deep link opens catalog

- GIVEN a device with the app installed
- WHEN opening `mbtrend://catalog`
- THEN the app opens AND navigates to the catalog screen

#### Scenario: Deep link with product slug

- GIVEN a device with the app installed
- WHEN opening `mbtrend://product/remera-negra`
- THEN the app opens AND navigates to the product detail screen

### Requirement: EAS Build profiles

`eas.json` MUST define profiles for `development`, `preview`, and `production`. The production profile SHALL use `android.buildType: "app-bundle"` and `ios.enterpriseProvisioning: "universal"`.

#### Scenario: Production build succeeds

- GIVEN the EAS project is configured and credentials are set
- WHEN running `eas build -p all --profile production --local`
- THEN both `.aab` (Android) and `.ipa` (iOS) artifacts are produced without errors

### Requirement: Build versioning

The app version (`version` in `app.json`) MUST follow semver. `versionCode` (Android) and `buildNumber` (iOS) SHALL increment with each production build.

#### Scenario: Version increment

- GIVEN the current version is `1.0.0` with build number `1`
- WHEN a new production build is triggered
- THEN the build number increments AND the version follows semver

# Getting Started with Inclusive Baker App on Windows

This guide will walk you through setting up your development environment on a Windows laptop to run, build, and debug the Inclusive Baker App.

## Part 1: Getting Started Locally (Web Browser)

### 1. Prerequisites

*   **Node.js (LTS):** Download and install the latest Long Term Support version from [nodejs.org](https://nodejs.org/). This will also install `npm`.
*   **Git:** Download and install Git from [git-scm.com](https://git-scm.com/).
*   **Expo CLI:** Install the Expo CLI globally by running the following command in your terminal:
    ```bash
    npm install -g expo-cli
    ```

### 2. Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/makerspaceEG/Inclusive-Bakeries.git
    cd Inclusive-Bakeries
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

### 3. Running the app on the web

1.  **Start the development server:**
    ```bash
    npm run web
    ```
2.  This will open a new tab in your web browser with the application running.

## Part 2: Building and Debugging on Android Emulator

### 1. Prerequisites

*   **Android Studio:** Download and install Android Studio from the [Android Developer website](https://developer.android.com/studio).
*   **Android Virtual Device (AVD):**
    1.  Open Android Studio.
    2.  Go to `Tools` > `AVD Manager`.
    3.  Click `Create Virtual Device` and follow the wizard to set up an emulator. We recommend a recent version of Android.
*   **Environment Variables:**
    1.  Find your Android SDK location in Android Studio under `File` > `Settings` > `Appearance & Behavior` > `System Settings` > `Android SDK`.
    2.  Add a new environment variable `ANDROID_HOME` with the path to your Android SDK.
    3.  Add the `platform-tools` directory to your system's `Path` variable (e.g., `%ANDROID_HOME%\platform-tools`).

### 2. Building and running the app

1.  **Start your Android Emulator** from the AVD Manager in Android Studio.
2.  **Run the app:**
    ```bash
    npm run android
    ```
    This command will build the app and install it on your running emulator.

### 3. Debugging

*   **Expo Developer Tools:** When you run the app, a web page with developer tools will open. You can use this to view logs, inspect elements, and more.
*   **Android Studio Logcat:** For more detailed device logs, you can use the `Logcat` window in Android Studio.

## Part 3: Installing the App on an Actual Device

### 1. Prerequisites

*   **Enable USB Debugging:** On your Android device, go to `Settings` > `About phone` and tap `Build number` seven times to enable Developer options. Then, go to `Settings` > `Developer options` and enable `USB debugging`.

### 2. Building a Development Build

1.  **Install EAS CLI:**
    ```bash
    npm install -g eas-cli
    ```
2.  **Log in to your Expo account:**
    ```bash
    eas login
    ```
3.  **Create a development build:**
    ```bash
    eas build --profile development --platform android
    ```
    This will create an `.apk` file that you can install on your device.

### 3. Installing the app

1.  **Download the APK:** Once the build is complete, download the `.apk` file from the link provided in the EAS build dashboard.
2.  **Install the APK:** Transfer the `.apk` file to your Android device and install it. You may need to enable "Install from unknown sources" in your device settings.
3.  **Connect to the development server:**
    1.  Start the development server on your computer:
        ```bash
        npm start
        ```
    2.  Open the installed app on your device. It should automatically connect to the development server if your computer and device are on the same Wi-Fi network. If not, you can scan the QR code from the terminal or the Expo Developer Tools to connect.

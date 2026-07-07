# Getting Started with Inclusive Baker App on Windows/Linux (WSL2 Ubuntu 24.04)

This guide will walk you through setting up your development environment on a Windows laptop to run, build, and debug the Inclusive Baker App.

## Part 1: Getting Started Locally (Web Browser)

### 1. Prerequisites

1. **Node.js (LTS):** For Windows - Download and install the latest Long Term Support version from [nodejs.org](https://nodejs.org/). This will also install `npm`.
2. **Node.js (LTS):** For Linux - running the following commands in your terminal:
    ```
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

    source ~/.bashrc

    nvm install --lts

    node -v
    npm -v

    ```
3. **Git:** For Windows - Download and install Git from [git-scm.com](https://git-scm.com/).
4. **Git:** For Linux - running the following command in your terminal:
    ```
    sudo apt install git
    ```
5. **Expo CLI:** For Windows and Linux - Install the Expo CLI globally by running the following command in your terminal:

    ```bash
    npm install -g expo-cli
    ```

### 2. Setup

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/Engineering-Good/help-me-weigh
    cd help-me-weigh
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```
    
    There will have vulnerabilities! Enter the following command to fix those vulunerabilites. 
    
    ```bash
    npm audit fix
    ```

3.  **Vulnerabilities cannot fix:**(Do not run it if you don't understand it) 

    Please raise up and do not run the following command as it will break more dependencies
    ```bash
    npm aduit fix --force
    ```

### 3. Running the app on the web

1.  **Start the development server:**
    ```bash
    npx expo start
    ```
2. **Will ses a list of menu:**
    Enter/open web
    ```bash
    press w
    ```
    This will open a new tab in your web browser and building the application. Give it awhile running.

## Part 2: Building and Debugging on Expo Client

### 1. Prerequisites

1.  Try to setup on local first on web browser.

### 2. Building a Development Build

1.  **Install EAS CLI:**

    ```bash
    npm install -g eas-cli
    ```
2.  **Check expo package**
    ```bash
    npx expo-doctor
    npx expo install --check
    Will error those 2 packages. It should be remove on 0.0.7 release, Please help to double check
    "expo-modules-autolinking": "^2.1.12",
    "@types/react-native": "^0.73.0",
    ```
    From package.json remove it
3.  **Create and log in to your Expo account:**

    Enter expo username and password
    ```bash
    eas login
    ```
4.  **Change all the version 0.0.x to +1 if developer didn’t change it on the code repos**

5. **eas init if you first time setup**
    
    It will show error message ask you to update the project ID
    ```bash
    eas init
    ```
6. **Copy the project ID and update on**
    ```
    a. App.json for this file needs to update the owner to your expo username. 
    b. if eas init error, on app.config.js remove projectID line if exist and rerun eas init
    ```

7. **Configure eas build**
    if eas.json is not exist.
    ```bash
    eas build:configure    
    ```

8. **Update and edit eas.json**
    developmentClient true = build on expo app
    developmentClitent false = buidl actual help me weigh app
    ```
    "environment": "development" inside "development": {}
    "developmentClient": true  to false 
    and add android build type as following
    "android": {
        "buildType": "apk"
      },

    ```
9. **Create eas env**
    ```bash
    eas env:create --name LEFU_API_KEY --value aabbcc --environment development --visibility sensitive

    eas env:create --name LEFU_API_SECRET --value ddeeff --environment development --visibility sensitive
    ```
10. **Update to eas**
    ```
    eas update --environment development -p android
    select branch if exist
    ```
    
11. **Create a development build on development client:**
    ```bash
    eas build --profile development --platform android 
    ```
   
### 3. Running the app on the Expo client
1.  **Download the APK:** Once the build is complete, download the `.apk` file from the link provided in the EAS build dashboard.
2.  **Install the APK:** Transfer the `.apk` file to your Android device and install it. You may need to enable "Install from unknown sources" in your device settings.

3.  **Start the development server:**
    ```bash
    npx expo start
    ```
4. **Will ses a list of menu:**
    Select Expo Go or development build
    ```bash
    press s
    ```
5.  Open the installed app on your device. It should automatically connect to the development server if your computer and device are on the same Wi-Fi network. If not, you can scan the QR code from the terminal or the Expo Developer Tools to connect.
    

## Part 3: Building and Debugging on Android Emulator (Not working with WSL2)

### 1. Prerequisites

1.  **Android Studio:** Download and install Android Studio from the [Android Developer website](https://developer.android.com/studio).
2.  **Android Virtual Device (AVD):**
    1.  Open Android Studio.
    2.  Go to `Tools` > `AVD Manager`.
    3.  Click `Create Virtual Device` and follow the wizard to set up an emulator. We recommend a recent version of Android.
3.  **Environment Variables:**
    1.  Find your Android SDK location in Android Studio under `File` > `Settings` > `Appearance & Behavior` > `System Settings` > `Android SDK`.
    2.  Add a new environment variable `ANDROID_HOME` with the path to your Android SDK.
    3.  Add the `platform-tools` directory to your system's `Path` variable (e.g., `%ANDROID_HOME%\platform-tools`).

### 2. Building and running the app

1.  **Start your Android Emulator** from the AVD Manager in Android Studio.
2.  **Run the app:**
    ```bash
    npx expo start
    ```
3. **Will ses a list of menu:**
    Select Android
    ```bash
    press a
    ```
    This command will build the app and install it on your running emulator. It will take some time.

### 3. Debugging

1.   **Expo Developer Tools:** When you run the app, a web page with developer tools will open. You can use this to view logs, inspect elements, and more.
2.   **Android Studio Logcat:** For more detailed device logs, you can use the `Logcat` window in Android Studio.

## Part 4: Bulid and Install the App on an Actual Device via USB 

### 1. Prerequisites

1.  **Enable USB Debugging:** On your Android device, go to `Settings` > `About phone` and tap `Build number` seven times to enable Developer options. Then, go to `Settings` > `Developer options` and enable `USB debugging`.

## Part 5: Build and Install the App via Expo EAS

### 1. Prerequisites

1.  Try to setup on local first on web browser and/or Expo Client.

### 2. Building a Development Build

1.  **Install EAS CLI:**
    ```bash
    npm install -g eas-cli
    ```
2.  **Check expo package**
    ```bash
    npx expo-doctor
    npx expo install --check
    Will error those 2 packages. It should be remove on 0.0.7 release, Please help to double check
    "expo-modules-autolinking": "^2.1.12",
    "@types/react-native": "^0.73.0",
    ```
    From package.json remove it
3.  **Create and log in to your Expo account:**

    Enter expo username and password
    ```bash
    eas login
    ```
4.  **Change all the version 0.0.x to +1 if developer didn’t change it on the code repos**

5. **eas init if you first time setup**
    
    It will show error message ask you to update the project ID
    ```bash
    eas init
    ```
6. **Copy the project ID and update on**
    ```
    a. App.json for this file needs to update the owner to your expo username. 
    b. if eas init error, on app.config.js remove projectID line if exist and rerun eas init
    ```
7. **Configure eas build**
    ```bash
    eas build:configure
    ```
8. **Update and edit eas.json**
    developmentClient true = build on expo app
    developmentClitent false = buidl actual help me weigh app
    ```
    "environment": "development" inside "development": {}
    "developmentClient": true  to false 
    and add android build type as following
    "android": {
        "buildType": "apk"
      },

    ```
9. **Create eas env**
    ```bash
    eas env:create --name LEFU_API_KEY --value aabbcc --environment development --visibility sensitive

    eas env:create --name LEFU_API_SECRET --value ddeeff --environment development --visibility sensitive
    ```
10. **Update to eas**
    ```
    eas update --environment development
    ```
11. **Create a development build on development client:**
    ```bash
    eas build --profile development --platform android 
    ```
   
### 3. Installing the app

1.  **Download the APK:** Once the build is complete, download the `.apk` file from the link provided in the EAS build dashboard.
2.  **Install the APK:** Transfer the `.apk` file to your Android device and install it. You may need to enable "Install from unknown sources" in your device settings.

## Part 6: Build and Install the App via Local Device

### 1. Prerequisites

1.  Try to setup on local first on web browser and/or Expo Client.

### 2. Building a Development Build

1.  **Install EAS CLI:**
    ```bash
    npm install -g eas-cli
    ```
2. **Create .env**
    ```bash
        cp .env.template .env
        nano .env 
        edit the key and secret 
        LEFU_API_KEY=<API_KEY>
        LEFU_API_SECRET=<SECRET_KEY>
    ```
11. **Create a development build on development client:**
    ```bash
    eas build --profile development --platform android --local
    ```
   
### 3. Installing the app

1.  **Install the APK:** Transfer the `.apk` file to your Android device and install it. You may need to enable "Install from unknown sources" in your device settings.

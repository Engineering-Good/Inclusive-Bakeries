# Inclusive Baker App
A React Native application designed to make baking accessible through smart kitchen scale integration and intuitive recipe management.

## Overview
The Inclusive Baker App is a cross-platform mobile application that connects with Bluetooth-enabled kitchen scales to provide precise measurements and step-by-step guidance for baking recipes. Built with React Native and Expo, it offers a seamless experience across both Android and Web platforms.

## Table of Contents

- Features
- Platforms
- Prerequisites
- Installation
- Running the Application
- Project Structure
- Technology Stack
- Configuration
- Development Notes



## Platforms
- Android (Native)
- Web (Progressive Web App)

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or Yarn
- Expo CLI (npm install -g expo-cli)
- Expo Account (sign up at https://expo.dev)
- EAS CLI (npm install -g eas-cli)

### For Android development:
- Android Studio
- Android SDK (minimum SDK version 21)
- Java Development Kit (JDK)
- Physical Android device (for testing Bluetooth features)

## Installation

```
# Clone the repository
git clone https://github.com/yourusername/InclusiveBakerApp.git

# Navigate to project directory
cd InclusiveBakerApp

# Install dependencies
npm install
```

## Running the Application

### Web Platform

```
# Start the web version
npm run web
```

The application will be available at http://localhost:19006

### Android Platform

Expo Go - to run in Emulator, limited Bluetooth functionality

```
# Start the Expo development server
npm start

# Press 'a' to run on Android
```

Development Build (Full Native Functionality)
```bash
# Login to your Expo account
eas login

# Configure EAS Build
eas build:configure

# Create development build
eas build --profile development --platform android

# Install the development build on your device
eas build:run --platform android

# Start the development server
npm start

# Scan the QR code with your device to connect
```

For subsequent development builds:
```bash
# Update the development build
eas update --branch development --message "update description"
```

Note: Development builds require a physical Android device for testing Bluetooth functionality. The Expo Go client does not support native Bluetooth features.


## Project Structure

```
InclusiveBakerApp/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   └── services/       # Business logic and services
├── modules/            # Native modules
├── assets/             # Images, fonts, and other static files
├── App.js              # Application entry point
└── package.json        # Project dependencies and scripts
```

## Technology Stack
- React Native - Core framework
- Expo - Development platform
- react-native-ble-plx - Bluetooth Low Energy support
- React Native Paper - Material Design components
- React Navigation - Navigation library


## Bluetooth Service Configuration
The BluetoothService includes:

- Mock implementation for Expo Go, returns a mock weight. Testing in Expo Go uses a mock implementation
- Native BLE implementation for development builds
- Automatic platform detection and service switching

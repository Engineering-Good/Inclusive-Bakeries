import {
	Alert,
	Linking,
	Permission,
	PermissionsAndroid,
	Platform,
	Rationale,
} from 'react-native'

export const showPermissionSettingsAlert = (permissionTitle: string) => {
	Alert.alert(
		`${permissionTitle} Needed`,
		`To use this feature, please enable ${permissionTitle.toLowerCase()} in your device settings.`,
		[
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Open Settings',
				onPress: () => Linking.openSettings(),
			},
		],
		{ cancelable: true }
	)
}

const requestSinglePermission = async (
	permission: Permission,
	rationale: Rationale
): Promise<boolean> => {
	console.log(`[Permission] Requesting ${permission}:`)
	const result = await PermissionsAndroid.request(permission, rationale)
	console.log(`[Permission] ${permission}:`, result)
	if (result === PermissionsAndroid.RESULTS.GRANTED) {
		return true
	}

	if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
		showPermissionSettingsAlert(rationale.title)
	}
}

const ensurePermissionGranted = async (
	permission: Permission,
	rationale: Rationale
): Promise<void> => {
	let granted = await requestSinglePermission(permission, rationale)

	if (!granted) {
		console.warn(`[Permission] ${permission} not granted, retrying...`)
		granted = await requestSinglePermission(permission, rationale)
		if (!granted) {
			throw new Error(`${rationale.title} is required.`)
		}
	}
}

export const requestPermissions = async () => {
	console.log('[Permissions] Requesting...')

	if (Platform.OS !== 'android') return

	const apiLevel = parseInt(Platform.Version.toString(), 10)
	console.log(`[Permissions] Android API level: ${apiLevel}`)

	// Request Bluetooth permissions (Android 12+)
	if (apiLevel >= 31) {
		await ensurePermissionGranted(
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
			{
				title: 'Bluetooth Scan Permission',
				message: 'App needs permission to scan for nearby Bluetooth devices.',
				buttonNeutral: 'Ask Me Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK',
			}
		)

		await ensurePermissionGranted(
			PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
			{
				title: 'Bluetooth Connect Permission',
				message: 'App needs permission to connect to Bluetooth devices.',
				buttonNeutral: 'Ask Me Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK',
			}
		)

		console.log('[Permissions] Bluetooth permissions granted')
	}

	// Request Location permission (needed for BLE scan)
	await ensurePermissionGranted(
		PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
		{
			title: 'Location Permission',
			message: 'Location access is required to scan for Bluetooth devices.',
			buttonNeutral: 'Ask Me Later',
			buttonNegative: 'Cancel',
			buttonPositive: 'OK',
		}
	)

	console.log('[Permissions] Location permission granted')
}

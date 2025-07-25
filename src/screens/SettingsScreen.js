import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { Fragment, useEffect, useState } from 'react' // Import Fragment
import { ScrollView, StyleSheet, TextInput, View } from 'react-native'
import {
	Button,
	Divider,
	List,
	Menu,
	Snackbar,
	Switch,
} from 'react-native-paper'
import ScaleConnectButton from '../components/ScaleConnectButton'
import { SCALE_SERVICES } from '../constants/ScaleServices'
import RecipeService from '../services/RecipeService' // Import RecipeService
import ScaleServiceFactory from '../services/ScaleServiceFactory'
import speechService from '../services/SpeechService'

const SettingsScreen = ({ navigation }) => {
	const [selectedScale, setSelectedScale] = useState(SCALE_SERVICES.MOCK)
	const [isDarkMode, setIsDarkMode] = useState(false)
	const [isConnected, setIsConnected] = useState(false)
	const [currentDevice, setCurrentDevice] = useState(null)
	const [snackbarVisible, setSnackbarVisible] = useState(false)
	const [snackbarMessage, setSnackbarMessage] = useState('')

	// Speech settings states
	const [speechDelay, setSpeechDelay] = useState(speechService.getSpeechDelay())
	const [speechRate, setSpeechRate] = useState(speechService.getSpeechRate())
	const [shouldSpeakWordByWord, setShouldSpeakWordByWord] = useState(
		speechService.getSpeakWordByWord()
	)
	const [preferredVoiceIdentifier, setPreferredVoiceIdentifier] = useState(
		speechService.getPreferredVoice()?.identifier || ''
	)
	const [availableVoices, setAvailableVoices] = useState([])
	const [voiceMenuVisible, setVoiceMenuVisible] = useState(false)

	useEffect(() => {
		loadSettings()
		loadSpeechSettings()
	}, [])

	// Check connection status periodically
	useEffect(() => {
		const checkConnection = () => {
			const status = ScaleServiceFactory.getConnectionStatus()
			setIsConnected(status.isConnected)
			setCurrentDevice(status.currentDevice)
		}

		// Check immediately
		checkConnection()

		// Check every 2 seconds
		const interval = setInterval(checkConnection, 2000)
		return () => clearInterval(interval)
	}, [])

	const loadSettings = async () => {
		try {
			const scale = await AsyncStorage.getItem('selectedScale')
			const darkMode = await AsyncStorage.getItem('isDarkMode')

			if (scale) setSelectedScale(scale)
			if (darkMode) setIsDarkMode(darkMode === 'true')

			// Get initial connection status
			const status = ScaleServiceFactory.getConnectionStatus()
			setIsConnected(status.isConnected)
			setCurrentDevice(status.currentDevice)
		} catch (error) {
			console.error('Error loading general settings:', error)
		}
	}

	const loadSpeechSettings = async () => {
		try {
			setSpeechDelay(speechService.getSpeechDelay())
			setSpeechRate(speechService.getSpeechRate())
			setShouldSpeakWordByWord(speechService.getSpeakWordByWord())
			const voices = speechService.getAvailableVoices()
			setAvailableVoices(voices)
			const currentPreferredVoice = speechService.getPreferredVoice()
			if (currentPreferredVoice) {
				setPreferredVoiceIdentifier(currentPreferredVoice.identifier)
			}
		} catch (error) {
			console.error('Error loading speech settings:', error)
		}
	}

	const handleScaleChange = async (scale) => {
		try {
			await AsyncStorage.setItem('selectedScale', scale)
			setSelectedScale(scale)
			await ScaleServiceFactory.setScaleService(scale)
		} catch (error) {
			console.error('Error saving scale setting:', error)
		}
	}

	const handleThemeChange = async (value) => {
		try {
			await AsyncStorage.setItem('isDarkMode', value.toString())
			setIsDarkMode(value)
		} catch (error) {
			console.error('Error saving theme setting:', error)
		}
	}

	const handleScaleLoad = ({ nativeEvent }) => {
		console.log('Scale view loaded:', nativeEvent.url)
	}

	const onDismissSnackBar = () => setSnackbarVisible(false)

	const handleResetRecipes = async () => {
		try {
			await RecipeService.resetRecipesToSampleData()
			setSnackbarMessage('Recipes have been reloaded with sample data.')
			setSnackbarVisible(true)
		} catch (error) {
			setSnackbarMessage('Failed to reset recipes.')
			setSnackbarVisible(true)
			console.error('Error resetting recipes:', error)
		}
	}

	const handleDisconnectScale = async () => {
		try {
			await ScaleServiceFactory.disconnectFromScale()
			setSnackbarMessage('Scale disconnected.')
			setSnackbarVisible(true)
		} catch (error) {
			setSnackbarMessage('Failed to disconnect scale.')
			setSnackbarVisible(true)
			console.error('Error disconnecting scale:', error)
		}
	}

	const handleSpeechDelayChange = (value) => {
		const delay = parseInt(value, 10)
		if (!isNaN(delay) && delay >= 0) {
			setSpeechDelay(delay)
			speechService.setSpeechDelay(delay)
		}
	}

	const handleSpeechRateChange = (value) => {
		const rate = parseFloat(value)
		if (!isNaN(rate) && rate >= 0.1 && rate <= 2.0) {
			// Common range for speech rate
			setSpeechRate(rate)
			speechService.setSpeechRate(rate)
		}
	}

	const handlePreferredVoiceChange = (voiceIdentifier) => {
		setPreferredVoiceIdentifier(voiceIdentifier)
		speechService.setPreferredVoice(voiceIdentifier)
		setVoiceMenuVisible(false)
	}

	const handleSpeakWordByWordChange = (value) => {
		setShouldSpeakWordByWord(value)
		speechService.setSpeakWordByWord(value)
	}

	const openVoiceMenu = () => setVoiceMenuVisible(true)
	const closeVoiceMenu = () => setVoiceMenuVisible(false)

	const getVoiceDisplayName = (identifier) => {
		const voice = availableVoices.find((v) => v.identifier === identifier)
		return voice ? `${voice.name} (${voice.language})` : 'Default Voice'
	}

	return (
		<Fragment>
			<ScrollView style={styles.container}>
				<List.Section>
					<List.Subheader>Scale Settings</List.Subheader>
					<List.Item
						title="Mock Scale"
						description="Use simulated scale readings"
						left={(props) => <List.Icon {...props} icon="scale" />}
						right={() => (
							<Switch
								value={selectedScale === SCALE_SERVICES.MOCK}
								onValueChange={() => handleScaleChange(SCALE_SERVICES.MOCK)}
							/>
						)}
					/>
					<List.Item
						title="Etekcity Scale"
						description="Use Etekcity Bluetooth scale"
						left={(props) => <List.Icon {...props} icon="scale" />}
						right={() => (
							<Switch
								value={selectedScale === SCALE_SERVICES.ETEKCITY}
								onValueChange={() => handleScaleChange(SCALE_SERVICES.ETEKCITY)}
							/>
						)}
					/>
					<List.Item
						title="Generic Bluetooth Scale"
						description="Use generic Bluetooth scale"
						left={(props) => <List.Icon {...props} icon="scale" />}
						right={() => (
							<Switch
								value={selectedScale === SCALE_SERVICES.BLUETOOTH}
								onValueChange={() =>
									handleScaleChange(SCALE_SERVICES.BLUETOOTH)
								}
							/>
						)}
					/>
					<List.Item
						title="Lefu Kitchen Scale"
						description="Use Lefu Kitchen Scale"
						left={(props) => <List.Icon {...props} icon="scale" />}
						right={() => (
							<Switch
								value={selectedScale === SCALE_SERVICES.LEFU}
								onValueChange={() => handleScaleChange(SCALE_SERVICES.LEFU)}
							/>
						)}
					/>
				</List.Section>

				<Divider />

				<List.Section>
					<List.Subheader>Connection Status</List.Subheader>
					<List.Item
						title="Connection Status"
						description={isConnected ? 'Connected' : 'Disconnected'}
						left={(props) => (
							<List.Icon
								{...props}
								icon={isConnected ? 'check-circle' : 'close-circle'}
								color={isConnected ? '#4CAF50' : '#f44336'}
							/>
						)}
					/>
					{currentDevice && (
						<List.Item
							title="Connected Device"
							description={currentDevice.name || 'Unknown Device'}
							left={(props) => <List.Icon {...props} icon="bluetooth" />}
						/>
					)}
				</List.Section>

				<View style={styles.connectContainer}>
					<ScaleConnectButton />
				</View>

				<Divider />

				<List.Section>
					<List.Subheader>Speech Settings</List.Subheader>
					<List.Item
						title="Speech Delay (ms)"
						description="Delay between speech segments in milliseconds"
						left={(props) => <List.Icon {...props} icon="timer-sand" />}
						right={() => (
							<TextInput
								style={styles.textInput}
								onChangeText={handleSpeechDelayChange}
								value={String(speechDelay)}
								keyboardType="numeric"
								placeholder="e.g., 2500"
							/>
						)}
					/>
					<List.Item
						title="Speech Rate"
						description="Speed of speech (0.1 - 2.0)"
						left={(props) => <List.Icon {...props} icon="speedometer" />}
						right={() => (
							<TextInput
								style={styles.textInput}
								onChangeText={handleSpeechRateChange}
								value={String(speechRate)}
								keyboardType="numeric"
								placeholder="e.g., 0.7"
							/>
						)}
					/>
					<List.Item
						title="Speak Word by Word"
						description="Speak text word by word instead of entire sentences"
						left={(props) => (
							<List.Icon {...props} icon="format-text-variant" />
						)}
						right={() => (
							<Switch
								value={shouldSpeakWordByWord}
								onValueChange={handleSpeakWordByWordChange}
							/>
						)}
					/>
					<Menu
						visible={voiceMenuVisible}
						onDismiss={closeVoiceMenu}
						anchor={
							<List.Item
								title="Preferred Voice"
								description={getVoiceDisplayName(preferredVoiceIdentifier)}
								left={(props) => <List.Icon {...props} icon="account-voice" />}
								right={(props) => <List.Icon {...props} icon="chevron-down" />}
								onPress={openVoiceMenu}
							/>
						}
					>
						{availableVoices.map((voice) => (
							<Menu.Item
								key={voice.identifier}
								onPress={() => handlePreferredVoiceChange(voice.identifier)}
								title={`${voice.name} (${voice.language})`}
								style={
									preferredVoiceIdentifier === voice.identifier
										? { backgroundColor: '#e0e0e0' }
										: {}
								}
							/>
						))}
					</Menu>
				</List.Section>

				<Divider />

				<List.Section>
					<List.Subheader>Data Management</List.Subheader>
					<View style={styles.buttonContainer}>
						<Button
							mode="contained"
							onPress={handleResetRecipes}
							buttonColor={'#FF9800'}
							style={styles.button}
						>
							Reload Recipes with Sample Data
						</Button>
					</View>
				</List.Section>

				<Divider />

				<List.Section>
					<List.Subheader>Appearance</List.Subheader>
					<List.Item
						title="Dark Mode"
						description="Use dark theme (Just for illustration, not working)"
						left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
						right={() => (
							<Switch value={isDarkMode} onValueChange={handleThemeChange} />
						)}
					/>
				</List.Section>
				{/*   // Uncomment if you want to add Lefu scale configuration (example )
        <View style={styles.scaleContainer}>
          <Text style={styles.sectionTitle}>Scale Configuration</Text>
          <LefuScaleView 
            style={styles.scaleView}
            url="about:blank" // Replace with actual configuration URL if needed
            onLoad={handleScaleLoad}
          />
        </View> */}
			</ScrollView>
			<Snackbar
				visible={snackbarVisible}
				onDismiss={onDismissSnackBar}
				duration={Snackbar.DURATION_SHORT}
				action={{
					label: 'Dismiss',
					onPress: () => {
						// Do something
					},
				}}
			>
				{snackbarMessage}
			</Snackbar>
		</Fragment>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	connectContainer: {
		padding: 16,
	},
	scaleContainer: {
		flex: 1,
		marginVertical: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 10,
	},
	scaleView: {
		flex: 1,
		borderWidth: 1,
		borderColor: '#ddd',
		borderRadius: 8,
		overflow: 'hidden',
	},
	buttonContainer: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	button: {
		marginTop: 10,
	},
	textInput: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 4,
		paddingHorizontal: 8,
		paddingVertical: 4,
		minWidth: 80,
		textAlign: 'right',
	},
})

export default SettingsScreen

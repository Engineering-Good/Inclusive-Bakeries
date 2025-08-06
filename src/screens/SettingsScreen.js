import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { Fragment, useEffect, useState } from 'react' // Import Fragment
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import {
	Button,
	Divider,
	List,
	Menu,
	Snackbar,
	Switch,
} from 'react-native-paper'
import Slider from '@react-native-community/slider'
import ScaleConnectButton from '../components/ScaleConnectButton'
import { SCALE_SERVICES } from '../constants/ScaleServices'
import RecipeService from '../services/RecipeService' // Import RecipeService
import ScaleServiceFactory from '../services/ScaleServiceFactory'
import speechService from '../services/SpeechService'

const SettingsScreen = ({ navigation }) => {
	const [selectedScale, setSelectedScale] = useState(SCALE_SERVICES.MOCK)
	const [isConnected, setIsConnected] = useState(false)
	const [currentDevice, setCurrentDevice] = useState(null)
	const [snackbarVisible, setSnackbarVisible] = useState(false)
	const [snackbarMessage, setSnackbarMessage] = useState('')
	const [scaleMenuVisible, setScaleMenuVisible] = useState(false)

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

			if (scale) setSelectedScale(scale)

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
		setSpeechDelay(delay)
		speechService.setSpeechDelay(delay)
	}

	const handleSpeechRateChange = (value) => {
		const rate = parseFloat(value.toFixed(1))
		setSpeechRate(rate)
		speechService.setSpeechRate(rate)
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

	const openScaleMenu = () => setScaleMenuVisible(true)
	const closeScaleMenu = () => setScaleMenuVisible(false)

	const getScaleDisplayName = (scale) => {
		switch (scale) {
			case SCALE_SERVICES.MOCK:
				return 'Mock Scale'
			case SCALE_SERVICES.ETEKCITY:
				return 'Etekcity Scale'
			case SCALE_SERVICES.BLUETOOTH:
				return 'Generic Bluetooth Scale'
			case SCALE_SERVICES.LEFU:
				return 'Lefu Kitchen Scale'
			default:
				return 'Select Scale'
		}
	}

	return (
		<Fragment>
			<ScrollView style={styles.container}>
				<List.Section>
					<List.Subheader>Scale Settings</List.Subheader>
					<Menu
						visible={scaleMenuVisible}
						onDismiss={closeScaleMenu}
						anchor={
							<List.Item
								title="Selected Scale"
								description={getScaleDisplayName(selectedScale)}
								left={(props) => <List.Icon {...props} icon="scale" />}
								right={(props) => <List.Icon {...props} icon="chevron-down" />}
								onPress={openScaleMenu}
							/>
						}
					>
						{Object.values(SCALE_SERVICES).map((scale) => (
							<Menu.Item
								key={scale}
								onPress={() => {
									handleScaleChange(scale)
									closeScaleMenu()
								}}
								title={getScaleDisplayName(scale)}
								style={
									selectedScale === scale
										? { backgroundColor: '#e0e0e0' }
										: {}
								}
							/>
						))}
					</Menu>
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
							<View style={styles.sliderContainer}>
								<Slider
									style={styles.slider}
									minimumValue={1000}
									maximumValue={5000}
									step={100}
									value={speechDelay}
									onValueChange={handleSpeechDelayChange}
								/>
								<Text style={styles.sliderValue}>{speechDelay}ms</Text>
							</View>
						)}
					/>
					<List.Item
						title="Speech Rate"
						description="Speed of speech (0.1 - 2.0)"
						left={(props) => <List.Icon {...props} icon="speedometer" />}
						right={() => (
							<View style={styles.sliderContainer}>
								<Slider
									style={styles.slider}
									minimumValue={0.1}
									maximumValue={2.0}
									step={0.1}
									value={speechRate}
									onValueChange={handleSpeechRateChange}
								/>
								<Text style={styles.sliderValue}>
									{speechRate.toFixed(1)}x
								</Text>
							</View>
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
		alignSelf: 'center',
		marginTop: 10,
	},
	sliderContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		width: 400,
	},
	slider: {
		flex: 1,
	},
	sliderValue: {
		width: 60,
		textAlign: 'right',
		paddingLeft: 10,
	},
})

export default SettingsScreen

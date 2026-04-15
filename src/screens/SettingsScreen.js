import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import React, { Fragment, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
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
import RecipeService from '../services/RecipeService'
import ScaleServiceFactory from '../services/ScaleServiceFactory'
import speechService from '../services/SpeechService'

const SPEECH_RATE_OPTIONS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
const SPEECH_DELAY_OPTIONS = [0, 500, 1000, 2000, 3000, 5000]

const resolvePickerOption = (value, fallback, options) =>
	options.includes(value) ? value : fallback

const formatDelayLabel = (ms) => {
	if (ms === 0) return '0ms'
	if (ms >= 1000) return `${ms / 1000}s`
	return `${ms}ms`
}

const formatRateLabel = (rate) => `${rate}x`

const SettingsScreen = ({ navigation }) => {
	const [selectedScale, setSelectedScale] = useState(SCALE_SERVICES.MOCK)
	const [isConnected, setIsConnected] = useState(false)
	const [currentDevice, setCurrentDevice] = useState(null)
	const [snackbarVisible, setSnackbarVisible] = useState(false)
	const [snackbarMessage, setSnackbarMessage] = useState('')
	const [scaleMenuVisible, setScaleMenuVisible] = useState(false)

	const [speechRate, setSpeechRate] = useState(
		resolvePickerOption(speechService.getSpeechRate(), 1.0, SPEECH_RATE_OPTIONS)
	)
	const [speechDelay, setSpeechDelay] = useState(
		resolvePickerOption(speechService.getSpeechDelay(), 1000, SPEECH_DELAY_OPTIONS)
	)
	const [shouldSpeakWordByWord, setShouldSpeakWordByWord] = useState(
		speechService.getSpeakWordByWord()
	)
	const [preferredVoiceIdentifier, setPreferredVoiceIdentifier] = useState(
		speechService.getPreferredVoice()?.identifier || ''
	)
	const [availableVoices, setAvailableVoices] = useState([])
	const [rateMenuVisible, setRateMenuVisible] = useState(false)
	const [delayMenuVisible, setDelayMenuVisible] = useState(false)
	const [voiceMenuVisible, setVoiceMenuVisible] = useState(false)

	const version = Constants.expoConfig.version
	const name = Constants.expoConfig.name

	useEffect(() => {
		loadSettings()
		loadSpeechSettings()
	}, [])

	useEffect(() => {
		const checkConnection = () => {
			const status = ScaleServiceFactory.getConnectionStatus()
			setIsConnected(status.isConnected)
			setCurrentDevice(status.currentDevice)
		}
		checkConnection()
		const interval = setInterval(checkConnection, 2000)
		return () => clearInterval(interval)
	}, [])

	const loadSettings = async () => {
		try {
			const scale = await AsyncStorage.getItem('selectedScale')
			if (scale) setSelectedScale(scale)
			const status = ScaleServiceFactory.getConnectionStatus()
			setIsConnected(status.isConnected)
			setCurrentDevice(status.currentDevice)
		} catch (error) {
			console.error('Error loading general settings:', error)
		}
	}

	const loadSpeechSettings = async () => {
		try {
			const delay = resolvePickerOption(speechService.getSpeechDelay(), 1000, SPEECH_DELAY_OPTIONS)
			const rate = resolvePickerOption(speechService.getSpeechRate(), 1.0, SPEECH_RATE_OPTIONS)
			setSpeechDelay(delay)
			setSpeechRate(rate)
			setShouldSpeakWordByWord(speechService.getSpeakWordByWord())
			const voices = speechService.getAvailableVoices()
			setAvailableVoices(voices)
			const voice = speechService.getPreferredVoice()
			if (voice) {
				setPreferredVoiceIdentifier(voice.identifier)
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

	const handleDelaySelect = (value) => {
		setSpeechDelay(value)
		speechService.setSpeechDelay(value)
		setDelayMenuVisible(false)
	}

	const handleRateSelect = (value) => {
		setSpeechRate(value)
		speechService.setSpeechRate(value)
		setRateMenuVisible(false)
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

	const getVoiceDisplayName = (identifier) => {
		const voice = availableVoices.find((v) => v.identifier === identifier)
		return voice ? `${voice.name} (${voice.language})` : 'Default Voice'
	}

	return (
		<Fragment>
			<ScrollView style={styles.container}>
				<List.Section>
					<List.Subheader>Scale Settings</List.Subheader>
					<Menu
						visible={scaleMenuVisible}
						onDismiss={() => setScaleMenuVisible(false)}
						anchor={
							<List.Item
								title="Selected Scale"
								description={getScaleDisplayName(selectedScale)}
								left={(props) =>
									<List.Icon {...props} icon="scale" />
								}
								right={(props) =>
									<List.Icon {...props} icon="chevron-down" />
								}
								onPress={() => setScaleMenuVisible(true)}
							/>
						}
					>
						{Object.values(SCALE_SERVICES).map((scale) => (
							<Menu.Item
								key={scale}
								onPress={() => handleScaleChange(scale)}
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

					<Menu
						visible={delayMenuVisible}
						onDismiss={() => setDelayMenuVisible(false)}
						anchor={
							<List.Item
								title="Speech Delay"
								description={formatDelayLabel(speechDelay)}
								left={(props) => <List.Icon {...props} icon="timer-sand" />}
								right={(props) =>
									<List.Icon {...props} icon="chevron-down" />
								}
								onPress={() => setDelayMenuVisible(true)}
							/>
						}
					>
						{SPEECH_DELAY_OPTIONS.map((delay) => (
							<Menu.Item
								key={delay}
								onPress={() => handleDelaySelect(delay)}
								title={formatDelayLabel(delay)}
								style={
									speechDelay === delay
										? { backgroundColor: '#e0e0e0' }
										: {}
								}
							/>
						))}
					</Menu>

					<Menu
						visible={rateMenuVisible}
						onDismiss={() => setRateMenuVisible(false)}
						anchor={
							<List.Item
								title="Speech Rate"
								description={formatRateLabel(speechRate)}
								left={(props) =>
									<List.Icon {...props} icon="speedometer" />
								}
								right={(props) =>
									<List.Icon {...props} icon="chevron-down" />
								}
								onPress={() => setRateMenuVisible(true)}
							/>
						}
					>
						{SPEECH_RATE_OPTIONS.map((rate) => (
							<Menu.Item
								key={rate}
								onPress={() => handleRateSelect(rate)}
								title={formatRateLabel(rate)}
								style={
									speechRate === rate
										? { backgroundColor: '#e0e0e0' }
										: {}
								}
							/>
						))}
					</Menu>

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
						onDismiss={() => setVoiceMenuVisible(false)}
						anchor={
							<List.Item
								title="Preferred Voice"
								description={getVoiceDisplayName(preferredVoiceIdentifier)}
								left={(props) =>
									<List.Icon {...props} icon="account-voice" />
								}
								right={(props) =>
									<List.Icon {...props} icon="chevron-down" />
								}
								onPress={() => setVoiceMenuVisible(true)}
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
					<List.Subheader>About</List.Subheader>
					<List.Item
						title={name}
						description={version}
						left={(props) => <List.Icon {...props} icon="information" />}
					/>
				</List.Section>
			</ScrollView>
			<Snackbar
				visible={snackbarVisible}
				onDismiss={onDismissSnackBar}
				duration={Snackbar.DURATION_SHORT}
				action={{
					label: 'Dismiss',
					onPress: () => {},
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
	buttonContainer: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	button: {
		alignSelf: 'center',
		marginTop: 10,
	},
})

export default SettingsScreen

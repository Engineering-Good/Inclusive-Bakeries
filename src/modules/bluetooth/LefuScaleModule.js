import LefuScale from 'lefu-scale'

export default class LefuScaleClass {
	constructor() {
		this.lefuScale = LefuScale
	}

	async initializeScale() {
		return this.lefuScale.initializeScale()
	}

	async startScan() {
		return this.lefuScale.startScan()
	}

	async stopScan() {
		return this.lefuScale.stopScan()
	}

	async connectToDevice(deviceId) {
		return this.lefuScale.connectToDevice(deviceId)
	}

	async disconnect() {
		return this.lefuScale.disconnect()
	}

	async hello() {
		return this.lefuScale.hello()
	}

	async getValueWithCallback(callback) {
		// MB-9 Testing of callback functions from .aar
		// not working as the build is not refreshed.
		console.log('EE', callback)
		console.log('EeeeeE', this.lefuScale)
		return this.lefuScale.getValueWithCallback(callback)
	}

	addWeightListener(callback) {
		return this.lefuScale.addListener('onWeightChange', callback)
	}

	addConnectionStateListener(callback) {
		return this.lefuScale.addListener('onConnectionStateChange', callback)
	}

	addErrorListener(callback) {
		return this.lefuScale.addListener('onError', callback)
	}
}

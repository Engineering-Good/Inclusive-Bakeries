import { ScaleInterface } from './ScaleInterface'

class MockScaleService extends ScaleInterface {
	constructor() {
		super()
		this.isScanning = false
		this.connectedDevice = null
		this.weightUpdateInterval = null
		this.currentWeight = 0
		this.deviceId = ''
		this.needsTare = false
	}

	startScan(onDeviceFound) {
		return new Promise((resolve, reject) => {
			if (this.isScanning) {
				reject(new Error('Scan already in progress'))
				return
			}

			this.isScanning = true

			// Simulate finding a device after 1 second
			setTimeout(() => {
				const mockDevice = {
					id: 'mock-device-1',
					name: 'Mock Scale',
					rssi: -50,
				}
				onDeviceFound(mockDevice)
				this.stopScan()
				resolve()
			}, 1000)
		})
	}

	stopScan() {
		this.isScanning = false
	}

	async connect(device, onWeightUpdate) {
		if (this.connectedDevice) {
			throw new Error('Already connected to a device')
		}

		// Simulate connection delay
		await new Promise((resolve) => setTimeout(resolve, 1000))

		this.connectedDevice = {
			id: device.id,
			name: 'Mock Scale',
		}
		this.deviceId = device.id
		// Start sending random weight updates
		this.startWeightUpdates(onWeightUpdate)

		return this.connectedDevice
	}

	startWeightUpdates(onWeightUpdate) {
		// Store the onWeightUpdate callback
		this.onWeightUpdateCallback = onWeightUpdate
		// Immediately send an initial weight update
		this.onWeightUpdateCallback({
			value: this.currentWeight,
			unit: 'g',
			isStable: true,
			isTare: this.needsTare,
		})
	}

  mockWeightChange(delta) {
    this.currentWeight += delta
    // Ensure weight doesn't go below zero
    this.currentWeight = Math.max(0, this.currentWeight)
    if (this.onWeightUpdateCallback) {
      this.onWeightUpdateCallback({
        value: this.currentWeight,
        unit: 'g',
        isStable: true, // Consider manual changes stable
        isTare: false,
      })
    }
  }

	mockStableWeight() {
		if (this.onWeightUpdateCallback) {
			this.onWeightUpdateCallback({
				value: this.currentWeight,
				unit: 'g',
				isStable: true,
				isTare: false,
			})
		}
	}

	mockTare() {
		this.currentWeight = 0
		if (this.onWeightUpdateCallback) {
			this.onWeightUpdateCallback({
				value: this.currentWeight,
				unit: 'g',
				isStable: true,
				isTare: true,
			})
		}
	}

	async disconnect() {
		this.connectedDevice = null
		this.currentWeight = 0
		this.onWeightUpdateCallback = null // Clear the callback
	}

  subscribe(onWeightUpdate) {
    // For mock scale, subscription is handled via connect callback
    // Return a no-op unsubscribe function
    return () => {}
  }

  async readWeight(device) {
    if (!this.connectedDevice || this.connectedDevice.id !== device.id) {
      throw new Error('Not connected to this device')
    }

    // Return the current mock weight
    return this.currentWeight
  }
}

export default new MockScaleService()

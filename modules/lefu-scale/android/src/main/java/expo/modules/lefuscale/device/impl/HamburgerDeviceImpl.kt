package expo.modules.lefuscale.device.impl

import expo.modules.lefuscale.device.AbstractDevice
import com.peng.ppscale.device.PeripheralHamburger.PPBlutoothPeripheralHamburgerController
import com.peng.ppscale.business.ble.listener.FoodScaleDataChangeListener
import com.peng.ppscale.business.ble.listener.PPBleStateInterface

class HamburgerDeviceImpl : AbstractDevice() {
    init {
        controller = PPBlutoothPeripheralHamburgerController()
    }

    /**
     * Attempts to connect to the device by starting a BLE scan.
     * Note: The actual connection is asynchronous. This method initiates the process.
     * @return `true` if the scan was started successfully, `false` otherwise.
     */
    override fun connect(): Boolean {
        lefuDevice?.let {
            controller?.startConnect(it, this.bleStateInterface)
        }
        return true
    }

    /**
     * Registers a listener for Bluetooth state changes.
     * The listener will be notified of connection status, etc.
     */
    override fun addBleStatusListener(listener: PPBleStateInterface) {
        this.bleStateInterface = listener
    }

    /**
     * Registers a listener for data received from the food scale.
     */
    override fun addDataListener(listener: FoodScaleDataChangeListener) {
        (controller as? PPBlutoothPeripheralHamburgerController)?.registDataChangeListener(listener)
        (controller as? PPBlutoothPeripheralHamburgerController)?.disConnect()
    }

    /**
     * Gets the current connection status from the SDK.
     * @return A string representing the current device status.
     */
    override fun getDeviceStatus(): Boolean {
        // The SDK might have a method to get the current connection state.
        // This is a placeholder for what that might look like.
        return true
    }

    override fun disconnect() {
        (controller as? PPBlutoothPeripheralHamburgerController)?.registDataChangeListener(null)
    }
}
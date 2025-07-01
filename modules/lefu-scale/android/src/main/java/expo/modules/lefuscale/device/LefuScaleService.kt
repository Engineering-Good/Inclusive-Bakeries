package expo.modules.lefuscale.device

import android.content.Context
import android.util.Log
import com.peng.ppscale.PPBluetoothKit
import com.peng.ppscale.business.ble.listener.PPBleStateInterface
import com.peng.ppscale.business.ble.listener.PPSearchDeviceInfoInterface
import com.peng.ppscale.business.state.PPBleWorkState
import com.peng.ppscale.search.PPSearchManager
import com.lefu.ppbase.PPDeviceModel

/**
 * A service class to manage interactions with the Lefu Scale SDK.
 * This class follows a singleton pattern to ensure a single instance manages
 * all BLE operations like scanning, connecting, and data processing.
 */
class LefuScaleService {

    companion object {
        val instance: LefuScaleService by lazy { LefuScaleService() }
        private const val TAG = "LefuScaleService"
    }

    private var searchManager: PPSearchManager? = null
    private var deviceImpl: AbstractDevice? = null

    val discoveredDevices = mutableListOf<PPDeviceModel>()
    var connectedDevice: PPDeviceModel? = null

    // region Callbacks
    /** Callback for when a new device is discovered during a scan. */
    var onDeviceDiscovered: ((PPDeviceModel) -> Unit)? = null

    /** Callback for changes in the overall BLE state (e.g., Bluetooth turned off). */
    var onBleStateChange: ((PPBleWorkState, PPDeviceModel?) -> Unit)? = null

    /** Callback for changes in the device connection state. */
    var onConnectionStateChange: ((PPBleWorkState, PPDeviceModel?) -> Unit)? = null

    /** Callback for when an error occurs during the data measurement process. */
    var onProcessError: ((String) -> Unit)? = null
    // endregion

    /**
     * Initializes the Lefu Scale SDK. This must be called before any other methods.
     * @param context The application context.
     * @param apiKey Your API key for the SDK.
     * @param apiSecret Your API secret for the SDK.
     */
    fun initializeSdk(context: Context, apiKey: String, apiSecret: String) {
        if (searchManager == null) {
            PPBluetoothKit.setDebug(true) // Enable debug logging
            PPBluetoothKit.initSdk(context, apiKey, apiSecret, "lefu.config")
            searchManager = PPSearchManager.getInstance()
            Log.d(TAG, "Lefu SDK Initialized")
        } else {
            Log.d(TAG, "Lefu SDK already initialized")
        }
    }

    /**
     * Starts scanning for nearby Lefu scales.
     * The caller is responsible for implementing the logic for discovered devices and state changes
     * via the provided callbacks. This includes managing any collection of discovered devices.
     * @param searchCallback The callback to handle discovered devices.
     * @param stateCallback The callback to handle BLE state changes during the scan.
     */
    fun startScan(searchCallback: PPSearchDeviceInfoInterface, stateCallback: PPBleStateInterface) {
        if (searchManager == null) {
            Log.e(TAG, "SDK not initialized. Call initializeSdk first.")
            return
        }
        searchManager?.startSearchDeviceList(
            30000,
            searchCallback,
            stateCallback
        )
        Log.d(TAG, "Scan started")
    }

    /**
     * Stops the device scan.
     */
    fun stopScan() {
        searchManager?.stopSearch()
        Log.d(TAG, "Scan stopped")
    }

    /**
     * Connects to a specific scale.
     * Connection status is reported via the [onConnectionStateChange] callback.
     * @param device The [PPDeviceModel] of the device to connect to.
     */
    fun connectToDevice(device: PPDeviceModel) {
        stopScan()
        Log.d(TAG, "Attempting to connect to ${device.deviceMac}")

        try {
            val newDeviceImpl = DeviceControllerFactory.getInstance(device.getDevicePeripheralType())

            newDeviceImpl.setDevice(device)
            newDeviceImpl.addBleStatusListener(object : PPBleStateInterface() {
                override fun monitorBluetoothWorkState(state: PPBleWorkState, deviceModel: PPDeviceModel?) {
                    Log.d(TAG, "Connection State: ${state.name}")
                    if (state == PPBleWorkState.PPBleWorkStateConnected) {
                        connectedDevice = deviceModel
                    } else if (state == PPBleWorkState.PPBleWorkStateDisconnected) {
                        if (connectedDevice?.deviceMac == deviceModel?.deviceMac) {
                            connectedDevice = null
                            deviceImpl = null
                        }
                    }
                    // Propagate the state change to any observers.
                    onConnectionStateChange?.invoke(state, deviceModel)
                }
            })

            this.deviceImpl = newDeviceImpl
            this.connectedDevice = device
            newDeviceImpl.connect()

        } catch (e: IllegalArgumentException) {
            Log.e(TAG, "Unsupported device type: ${device.getDevicePeripheralType()}", e)
            onProcessError?.invoke("Unsupported device type: ${device.getDevicePeripheralType()}")
        }
    }

    /**
     * Disconnects from the currently connected device.
     */
    fun disconnect() {
        deviceImpl?.let { deviceToDisconnect ->
            Log.d(TAG, "Disconnecting from ${connectedDevice?.deviceMac ?: "unknown device"}")
            deviceToDisconnect.disconnect()
            connectedDevice = null
            deviceImpl = null
        }
    }
}
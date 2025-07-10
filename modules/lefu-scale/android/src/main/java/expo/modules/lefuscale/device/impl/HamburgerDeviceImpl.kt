package expo.modules.lefuscale.device.impl

import java.util.concurrent.atomic.AtomicLong
import expo.modules.lefuscale.device.AbstractDevice
import expo.modules.lefuscale.device.utils.FoodScaleUtils
import com.lefu.ppbase.PPDeviceModel
import com.peng.ppscale.device.PeripheralHamburger.PPBlutoothPeripheralHamburgerController
import com.peng.ppscale.business.ble.listener.FoodScaleDataChangeListener
import com.peng.ppscale.business.ble.listener.PPBleStateInterface
import com.peng.ppscale.vo.LFFoodScaleGeneral
import android.util.Log
import kotlinx.coroutines.*

class HamburgerDeviceImpl : AbstractDevice() {

    private val TAG = "LefuScaleService: HamburgerDevice"
    private val timeout = 4_000L
    private var lastWeightReceivedTime = AtomicLong(0L)
    private var disconnectMonitorJob: Job? = null

    private val hamburgerController: PPBlutoothPeripheralHamburgerController?
        get() = controller as? PPBlutoothPeripheralHamburgerController

    private val dataChangeListener = object : FoodScaleDataChangeListener() {
        override fun processData(foodScaleGeneral: LFFoodScaleGeneral?, deviceModel: PPDeviceModel) {
            foodScaleGeneral?.let {
                lastWeightReceivedTime.set(System.currentTimeMillis())
                FoodScaleUtils.handleScaleData(it, isStable = false) { payload ->
                    onDataChange!!.invoke(payload)
                }
            }
        }

        override fun lockedData(foodScaleGeneral: LFFoodScaleGeneral?, deviceModel: PPDeviceModel) {
            foodScaleGeneral?.let {
                lastWeightReceivedTime.set(System.currentTimeMillis())
                FoodScaleUtils.handleScaleData(it, isStable = true) { payload ->
                    onDataChange!!.invoke(payload)
                }
            }
        }
    }

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
            hamburgerController?.startSearch(it.deviceMac, this.bleStateInterface)
            lastWeightReceivedTime.set(System.currentTimeMillis())
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
    override fun startDataListener() {
        hamburgerController?.registDataChangeListener(dataChangeListener)
    }

    /**
     * Unregister listener to receive data from the device.
     */
    override fun removeDataListener() {
        hamburgerController?.registDataChangeListener(null)
    }

    /**
     * Gets the current connection status from the SDK.
     * @return A string representing the current device status.
     */
    override fun getDeviceStatus(): Boolean {
        
        return true
    }

    override fun autoReconnect() {
        lastWeightReceivedTime.set(System.currentTimeMillis())
        this.disconnectMonitorJob?.cancel()
        this.disconnectMonitorJob = CoroutineScope(Dispatchers.Default).launch {
            while (isActive) {
                val elapsed = System.currentTimeMillis() - lastWeightReceivedTime.get()
                if (elapsed > timeout) {
                    Log.d(TAG, "Device broadcast not recieved for $elapsed ms.")
                    onDisconnect!!.invoke("hasDisconnected")
                    cancel()
                }
                delay(1000)
            }
        }
    }

    override fun disconnect() {
        hamburgerController?.registDataChangeListener(null)
        hamburgerController?.disConnect()
    }
}

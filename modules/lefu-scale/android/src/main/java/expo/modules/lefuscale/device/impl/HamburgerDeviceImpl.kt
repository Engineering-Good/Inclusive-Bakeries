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
    private var isActive = false
    private var isDisconnected = true

    private val hamburgerController: PPBlutoothPeripheralHamburgerController
        get() = controller as PPBlutoothPeripheralHamburgerController

    private val dataChangeListener = object : FoodScaleDataChangeListener() {
        override fun processData(foodScaleGeneral: LFFoodScaleGeneral?, deviceModel: PPDeviceModel) {
            foodScaleGeneral?.let {
                lastWeightReceivedTime.set(System.currentTimeMillis())
                isDisconnected = false
                FoodScaleUtils.handleScaleData(it, isStable = false) { payload ->
                    onDataChange!!.invoke(payload)
                }
            }
        }

        override fun lockedData(foodScaleGeneral: LFFoodScaleGeneral?, deviceModel: PPDeviceModel) {
            foodScaleGeneral?.let {
                lastWeightReceivedTime.set(System.currentTimeMillis())
                isDisconnected = false
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
        Log.d(TAG, "Connecting to lefuscale ${lefuDevice!!.deviceMac}")
        lefuDevice!!.let {
            hamburgerController.startSearch(it.deviceMac, this.bleStateInterface)
        }
        this.isActive = true
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
        hamburgerController.registDataChangeListener(dataChangeListener)
    }

    /**
     * Unregister listener to receive data from the device.
     */
    override fun removeDataListener() {
        hamburgerController.registDataChangeListener(null)
    }

    /**
     * Gets the current connection status from the SDK.
     * @return A string representing the current device status.
     */
    override fun getDeviceStatus(): Boolean {
        
        return true
    }

    /** 
     * Function will execute on a background thread checking the 
     * last update from lefuScale after the defined timeout and if scale is connected
     */ 
    override fun autoReconnect() {
        this.disconnectMonitorJob?.cancel()
        this.disconnectMonitorJob = CoroutineScope(Dispatchers.Default).launch {
            while (this@HamburgerDeviceImpl.isActive) {
                val elapsed = System.currentTimeMillis() - lastWeightReceivedTime.get()
                if (elapsed > timeout) {
                    Log.d(TAG, "Doing routine check after $elapsed ms.")
                    connect()
                    if (isDisconnected){
                        onNotFound!!.invoke("CustomPPBWorkSearchNotFound")
                    }
                    isDisconnected = true
                }
                delay(1000)
            }
        }
    }
    

    override fun disconnect() {
        this.isActive = false
        this.lefuDevice = null
        lastWeightReceivedTime = AtomicLong(0L)
        hamburgerController.registDataChangeListener(null)
        hamburgerController.disConnect()
    }
}

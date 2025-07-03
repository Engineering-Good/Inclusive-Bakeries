package expo.modules.lefuscale

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.lefuscale.util.FoodScaleUnit
import expo.modules.lefuscale.util.FoodScaleUtils
import com.peng.ppscale.search.PPSearchManager
import com.peng.ppscale.PPBluetoothKit
import com.lefu.ppbase.PPSDKKit
import com.lefu.ppbase.PPDeviceModel
import com.peng.ppscale.business.ble.listener.PPBleStateInterface
import com.lefu.ppbase.PPScaleDefine.PPDevicePeripheralType
import com.peng.ppscale.business.ble.listener.PPSearchDeviceInfoInterface
import com.peng.ppscale.business.state.PPBleWorkState
import com.peng.ppscale.device.PPBlutoothPeripheralBaseController
import com.peng.ppscale.device.PeripheralHamburger.PPBlutoothPeripheralHamburgerController
import com.peng.ppscale.business.ble.listener.FoodScaleDataChangeListener
import com.peng.ppscale.vo.LFFoodScaleGeneral
import kotlinx.coroutines.*
import android.util.Log
import kotlinx.coroutines.*
import java.util.concurrent.atomic.AtomicLong
import java.net.URL


class LefuScaleModule : Module() {
  // Coroutine scope for managing background tasks, tied to the module's lifecycle.
  private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  private var ppScale: PPSearchManager? = null
  private val discoveredDevices = mutableListOf<PPDeviceModel>()
  private var connectedDevice: PPDeviceModel? = null
  private var deviceController: PPBlutoothPeripheralBaseController? = null
  private var lastWeightReceivedTime = AtomicLong(0L)
  private var disconnectMonitorJob: Job? = null

  private val dataChangeListener = object : FoodScaleDataChangeListener() {
    override fun processData(foodScaleGeneral: LFFoodScaleGeneral?, deviceModel: PPDeviceModel) {
      foodScaleGeneral?.let {
        lastWeightReceivedTime.set(System.currentTimeMillis())
        FoodScaleUtils.handleScaleData(it, isStable = false) { event, payload ->
          sendEvent(event, payload)
        }
      }
    }

    override fun lockedData(foodScaleGeneral: LFFoodScaleGeneral?, deviceModel: PPDeviceModel) {
      foodScaleGeneral?.let {
        lastWeightReceivedTime.set(System.currentTimeMillis())
        FoodScaleUtils.handleScaleData(it, isStable = true) { event, payload ->
          sendEvent(event, payload)
        }
      }
    }
  }


  // Job to hold the reconnection coroutine, allowing it to be cancelled.
  private var reconnectJob: Job? = null
  // The MAC address of the device to reconnect to. This must be set from JS.
  private var discoveredDeviceAddress: String? = null

  override fun definition() = ModuleDefinition {
    Name("LefuScale")

    Constants(
      "PI" to Math.PI
    )

    // Defines event names that the module can send to JavaScript.
    Events("onChange", "onDeviceDiscovered", "onBleStateChange", "onWeightChange", "hasDisconnected")

    Function("getInstance") {
      val manager = PPSearchManager.getInstance()
      return@Function manager.toString()
    }

    AsyncFunction("setValueAsync") { value: String ->
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    View(LefuScaleView::class) {
      Prop("url") { view: LefuScaleView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      Events("onLoad")
    }

    AsyncFunction("initializeSdk") { apiKey: String, apiSecret: String ->
      val context = appContext.reactContext?.applicationContext
      if (context != null) {
        PPBluetoothKit.setDebug(true)

        PPBluetoothKit.initSdk(
          context,
          apiKey,
          apiSecret,
          "lefu.config"
        )

        if (ppScale == null) {
          ppScale = PPSearchManager.getInstance()
        }
      }
    }

    AsyncFunction("startScan") {
      discoveredDevices.clear()

      if (ppScale == null) {
        sendEvent("onBleStateChange", mapOf("state" to "Error", "error" to "ppScale not initialized"))
        return@AsyncFunction null
      }

      ppScale?.startSearchDeviceList(
        30000, // scan for 30 seconds
        PPSearchDeviceInfoInterface { device, _ ->
          device?.let {
            if (discoveredDevices.none { it.deviceMac == device.deviceMac }) {
              discoveredDevices.add(device)
              sendEvent("onDeviceDiscovered", mapOf(
                "name" to device.deviceName,
                "mac" to device.deviceMac,
                "rssi" to device.rssi
              ))
            }
          }
        },
        object : PPBleStateInterface() {
          override fun monitorBluetoothWorkState(
            state: PPBleWorkState,
            deviceModel: PPDeviceModel?
          ) {
            val status = state.name
            sendEvent("onBleStateChange", mapOf("state" to status))
          }
        }
      )
    }

      // Function to set the device address from JS before attempting to reconnect
      Function("setDeviceAddress") { address: String ->
          discoveredDeviceAddress = address
      }

    fun connectToDeviceLogic(mac: String?, disconnectTimeoutMillis: Long? = null) {
      if (mac.isNullOrEmpty()) {
        sendEvent("onBleStateChange", mapOf("state" to "Error", "error" to "Invalid MAC address"))
        return
      }

      // Set the address for future reconnections
      discoveredDeviceAddress = mac
      val timeout = disconnectTimeoutMillis ?: 10_000L

      val device = discoveredDevices.find { it.deviceMac == mac }

      Log.d("LefuScaleModule", "device status: $device")

      if (device == null) {
        sendEvent("onBleStateChange", mapOf("state" to "Device not found"))
        return
      }

      if (device.getDevicePeripheralType() != PPDevicePeripheralType.PeripheralHamburger) {
        sendEvent("onBleStateChange", mapOf("state" to "Unsupported Device"))
        return
      }

      deviceController = PPBlutoothPeripheralHamburgerController()

      val bleStateInterface = object : PPBleStateInterface() {
        override fun monitorBluetoothWorkState(state: PPBleWorkState, deviceModel: PPDeviceModel?) {
          sendEvent("onBleStateChange", mapOf("state" to state.name))
        }
      }

      (deviceController as? PPBlutoothPeripheralHamburgerController)?.let { controller ->
        controller.registDataChangeListener(dataChangeListener)
        controller.startSearch(device.deviceMac, bleStateInterface)
        lastWeightReceivedTime.set(System.currentTimeMillis()) // Initialize timestamp
        disconnectMonitorJob?.cancel()
        disconnectMonitorJob = CoroutineScope(Dispatchers.Default).launch {
          while (isActive) {
            val elapsed = System.currentTimeMillis() - lastWeightReceivedTime.get()
            if (elapsed > timeout) {
              sendEvent("hasDisconnected", mapOf("reason" to "No weight data received"))
              cancel()
            }
            delay(1000)
          }
        }
      }
    }


    AsyncFunction("connectToDevice") { mac: String?, disconnectTimeoutMillis: Long? ->
      connectToDeviceLogic(mac, disconnectTimeoutMillis)
    }


    AsyncFunction("disconnect") {
      deviceController?.disConnect()
      deviceController = null
      ppScale = null
      disconnectMonitorJob?.cancel()
      sendEvent("onBleStateChange", mapOf("state" to "Disconnected"))
    }


    AsyncFunction("checkConnection") {
      Log.d("LefuScaleModule", "reconnect called")
      val address = discoveredDeviceAddress
      discoveredDevices.clear()

      if (ppScale == null) {
        sendEvent("onBleStateChange", mapOf("state" to "Error", "error" to "ppScale not initialized"))
        return@AsyncFunction null
      }

      var foundMatchingDevice = false

      val handler = android.os.Handler(android.os.Looper.getMainLooper())
      // This Runnable will now be the ONLY source of the "NotFound" event from this function.
      val notFoundRunnable = Runnable {
        if (!foundMatchingDevice) {
          Log.d("LefuScaleModule", "Device not found after timeout.")
          sendEvent("onBleStateChange", mapOf("state" to "NotFound"))
        }
      }

      ppScale?.startSearchDeviceList(
        10000, // Scan for 10 seconds
        PPSearchDeviceInfoInterface { device, _ ->
          device?.let {
            discoveredDevices.add(it)
            if (it.deviceMac == address) {
              foundMatchingDevice = true
              Log.d("LefuScaleModule", "Device is found: true")
              handler.removeCallbacks(notFoundRunnable)
              // connectToDeviceLogic(address)
            }
          }
        },
        object : PPBleStateInterface() {
          override fun monitorBluetoothWorkState(
            state: PPBleWorkState,
            deviceModel: PPDeviceModel?
          ) {
            // REMOVED the faulty "if(!foundMatchingDevice)" check.
            // Now, we just forward the actual state of the scanner.
            val status = state.name
            sendEvent("onBleStateChange", mapOf("state" to status))

            // You could also use the SDK's timeout event for a more robust solution
            if (status == "PPBleWorkSearchTimeOut" && !foundMatchingDevice) {
              sendEvent("onBleStateChange", mapOf("state" to "NotFound"))
            }
          }
        }
      )

      // Schedule the "NotFound" check. Let's increase the delay slightly to give the scan more time.
      handler.postDelayed(notFoundRunnable, 5000) // Check after 5 seconds

      return@AsyncFunction null
    }


    AsyncFunction("stopScan") {
      ppScale?.stopSearch()
    }

    OnDestroy {
      // Cancel all coroutines when the module is destroyed to prevent memory leaks.
      moduleScope.cancel()
    }
  }
}
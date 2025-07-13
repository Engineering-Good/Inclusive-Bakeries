package expo.modules.lefuscale

import expo.modules.kotlin.modules.Module
import com.lefu.ppbase.PPDeviceModel
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.lefuscale.device.LefuScaleService
import kotlinx.coroutines.*

class LefuScaleModule : Module() {
  private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  private var lefuService: LefuScaleService? = null

  override fun definition() = ModuleDefinition {
    Name("LefuScale")

    // Declare all events that can be sent to JavaScript.
    Events("onDeviceDiscovered", "onBleStateChange", "onWeightChange", "hasDisconnected", "onConnectError")

    AsyncFunction("initializeSdk") { apiKey: String, apiSecret: String ->
      val context = requireNotNull(appContext.reactContext?.applicationContext) {
        "Application context is not available."
      }
      
      if (lefuService == null) {
        lefuService = LefuScaleService.instance
        setupLefuEventListeners()
      }
      lefuService?.initializeSdk(context, apiKey, apiSecret)
    }

    AsyncFunction("startScan") {
      lefuService?.startScan()
    }

    AsyncFunction("connectToDevice") { mac: String? ->
      mac?.let {
        lefuService?.connectToDevice(it)
      }
    }

    AsyncFunction("disconnect") {
      lefuService?.disconnect()
      sendEvent("onBleStateChange", mapOf("state" to "Disconnected"))
    }

    AsyncFunction("stopScan") {
      lefuService?.stopScan()
    }

    AsyncFunction("checkConnection") {
      lefuService?.checkConnection()
    }

    OnDestroy {
      // Cancel all coroutines when the module is destroyed to prevent memory leaks.
      moduleScope.cancel()
    }
  }

  private fun setupLefuEventListeners() {
    lefuService?.onDeviceDiscovered = { device ->
      val deviceInfo = mapOf(
        "name" to device.deviceName,
        "mac" to device.deviceMac,
        "rssi" to device.rssi,
        "deviceType" to device.getDevicePeripheralType().name
      )
      sendEvent("onDeviceDiscovered", deviceInfo)
    }

    lefuService?.onConnectError = { errorMessage ->
      sendEvent("onConnectError", errorMessage)
    }

    lefuService?.onConnectionStateChange = { state ->
      if (state == "hasDisconnected") {
        sendEvent("hasDisconnected", mapOf("reason" to "No weight data received"))
      } else {
        sendEvent("onBleStateChange", mapOf("state" to state))
      }
    }

    lefuService?.onWeightDataChange = { payload ->
      sendEvent("onWeightChange", payload)
    }
  }
}

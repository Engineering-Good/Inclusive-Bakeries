package expo.modules.lefuscale

import expo.modules.kotlin.modules.Module
import com.lefu.ppbase.PPDeviceModel
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.lefuscale.device.LefuScaleService
import kotlinx.coroutines.*
import android.util.Log

class LefuScaleModule : Module() {
  private val moduleScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

  private var lefuService: LefuScaleService? = null

  override fun definition() = ModuleDefinition {
    Name("LefuScale")

    // Declare all events that can be sent to JavaScript.
    Events("onDeviceDiscovered", "onBleStateChange", "onWeightChange", "onConnectError")

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
      sendEvent("onBleStateChange", mapOf("state" to "CustomPPBWorkSearchDeviceDisconnected"))
    }

    AsyncFunction("stopScan") {
      lefuService?.stopScan()
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
        "id" to device.deviceMac,
        "rssi" to device.rssi,
        "deviceType" to device.getDevicePeripheralType().name
      )
      sendEvent("onDeviceDiscovered", deviceInfo)
    }

    lefuService?.onBleStateChange = { state, _ ->
      if (lefuService?.deviceImpl?.lefuDevice === null){
        sendEvent("onBleStateChange", mapOf("state" to state.name))
      }
    }

    lefuService?.onConnectError = { errorMessage ->
      sendEvent("onConnectError", errorMessage)
    }

    lefuService?.onConnectionStateChange = { state ->
      sendEvent("onBleStateChange", mapOf("state" to state))
    }

    lefuService?.onWeightDataChange = { payload ->
      sendEvent("onWeightChange", payload)
    }
  }
}

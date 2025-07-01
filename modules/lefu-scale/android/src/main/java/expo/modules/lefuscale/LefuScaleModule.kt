package expo.modules.lefuscale

import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.net.URL
import expo.modules.lefuscale.device.LefuScaleService
import com.peng.ppscale.business.ble.listener.PPBleStateInterface
import com.peng.ppscale.business.ble.listener.PPSearchDeviceInfoInterface
import com.peng.ppscale.business.state.PPBleWorkState
import com.lefu.ppbase.PPDeviceModel

class LefuScaleModule : Module() {
  private var lefuService: LefuScaleService? = null

  override fun definition() = ModuleDefinition {
    Name("LefuScale")

    // Defines event names that the module can send to JavaScript.
    Events("onChange", "onDeviceDiscovered", "onBleStateChange")

    AsyncFunction("initializeSdk") { apiKey: String, apiSecret: String ->
      val context = requireNotNull(appContext.reactContext?.applicationContext) {
        "Application context is not available."
      }

      lefuService = LefuScaleService()
      lefuService?.initializeSdk(context, apiKey, apiSecret)
    }

    AsyncFunction("startScan") {
      lefuService?.startScan(PPSearchDeviceInfoInterface { device, data ->
          device?.let {
            Log.d("LefuModule", "Discovered Device: ${device.deviceName} - ${device.deviceMac} (${device.getDevicePeripheralType().name})")
            sendEvent("onDeviceDiscovered", mapOf(
              "name" to device.deviceName,
              "mac" to device.deviceMac,
              "rssi" to device.rssi
            ))
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
        })
    }

    AsyncFunction("stopScan") {
      lefuService?.stopScan()
    }

  }
}

package expo.modules.lefuscale

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
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
import kotlinx.coroutines.Job
import android.util.Log
import java.net.URL

class LefuScaleModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  private var ppScale: PPSearchManager? = null
  private val discoveredDevices = mutableListOf<PPDeviceModel>()
  private var connectedDevice: PPDeviceModel? = null
  private var deviceController: PPBlutoothPeripheralBaseController? = null
  private var _reconnectJob: Job? = null

  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('LefuScale')` in JavaScript.
    Name("LefuScale")

    // Sets constant properties on the module. Can take a dictionary or a closure that returns a dictionary.
    Constants(
      "PI" to Math.PI
    )

    // Defines event names that the module can send to JavaScript.
    Events("onChange", "onDeviceDiscovered", "onBleStateChange")

    // Defines a JavaScript synchronous function that runs the native code on the JavaScript thread.
    Function("getInstance") {
      // "Hello world! 👋"
      var manager = PPSearchManager.getInstance()
      return@Function manager.toString()
    }

    // Defines a JavaScript function that always returns a Promise and whose native code
    // is by default dispatched on the different thread than the JavaScript runtime runs on.
    AsyncFunction("setValueAsync") { value: String ->
      // Send an event to JavaScript.
      sendEvent("onChange", mapOf(
        "value" to value
      ))
    }

    // Enables the module to be used as a native view. Definition components that are accepted as part of
    // the view definition: Prop, Events.
    View(LefuScaleView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: LefuScaleView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      // Defines an event that the view can send to JavaScript.
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

      ppScale?.startSearchDeviceList(
        30000, // scan for 30 seconds
        PPSearchDeviceInfoInterface { device, data ->
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

    AsyncFunction("connectToDevice") { mac: String? -> 
      if (mac.isNullOrEmpty()) {
        sendEvent("onBleStateChange", mapOf("state" to "Invalid MAC address"))
      }

      if (ppScale == null) {
        ppScale = PPSearchManager.getInstance()
      }

      val device = discoveredDevices.find { it.deviceMac == mac}

      if (device == null) {
        sendEvent("onBleStateChange", mapOf("state" to "Device not found"))
      }

     if (device!!.getDevicePeripheralType() != PPDevicePeripheralType.PeripheralHamburger) {
        sendEvent("onBleStateChange", mapOf("state" to "Unsupported Device"))
      }

      deviceController = PPBlutoothPeripheralHamburgerController()

      val bleStateInterface = object : PPBleStateInterface() {
        override fun monitorBluetoothWorkState(
          state: PPBleWorkState,
          deviceModel: PPDeviceModel?
        ) {
          sendEvent("onBleStateChange", mapOf("state" to state.name))
        }
      }

      (deviceController as? PPBlutoothPeripheralHamburgerController)?.let { controller ->
        // Need it when implementing data change
        // controller.registDataChangeListener(dataChangeListener)
        controller.startSearch(device!!.deviceMac, bleStateInterface)
        // deviceStatusState = PPBleWorkState.PPBleWorkStateConnecting.name
      }
    }

    AsyncFunction("disconnect") {
      deviceController?.disConnect()
      deviceController = null
      ppScale = null
      _reconnectJob?.cancel()
      sendEvent("onBleStateChange", mapOf("state" to "Disconnected"))
    }

    AsyncFunction("stopScan") {
      ppScale?.stopSearch()
    }
  }
}

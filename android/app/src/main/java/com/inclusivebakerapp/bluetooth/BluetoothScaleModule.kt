package com.inclusivebakerapp.bluetooth

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.peng.ppscale.PPBluetoothKit
import com.peng.ppscale.business.ble.listener.PPBleStateInterface
import com.peng.ppscale.search.PPSearchManager

class BluetoothScaleModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    var ppScale: PPSearchManager? = null

    private val TAG = "BluetoothScaleModule"

    override fun getName() = "BluetoothScaleModule"

    @ReactMethod
    fun initialize(appKey: String, appSecret: String, promise: Promise) {
        try {
            PPBluetoothKit.initSdk(reactApplicationContext, appKey, appSecret, "lefu.config")
            PPBluetoothKit.setDebug(true)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INIT_ERROR", e)
        }
    }

//    @ReactMethod
//    fun startScanning() {
//        if (ppScale == null) {
//            ppScale = PPSearchManager()
//        }
//        //You can dynamically set the scan time in ms
//        ppScale?.startSearchDeviceList(300000, searchDeviceInfoInterface, bleStateInterface)
//
//    }
//
//    @ReactMethod
//    fun connect(address: String, promise: Promise) {
//        PPBluetoothKit.connect(address) { connected: Boolean ->
//            if (connected) {
//                promise.resolve(true)
//            } else {
//                promise.reject("CONNECT_ERROR", "Failed to connect")
//            }
//        }
//    }
//
//    @ReactMethod
//    fun stopScanning() {
//        PPBluetoothKit.stopScan()
//    }
//
//
//    @ReactMethod
//    fun disconnect(address: String) {
//        PPBluetoothKit.disconnect(address)
//    }
//
//    private fun sendEvent(eventName: String, params: WritableMap?) {
//        reactApplicationContext
//            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
//            .emit(eventName, params)
//    }
}

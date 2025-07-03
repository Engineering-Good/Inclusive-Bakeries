package expo.modules.lefuscale.util

import com.lefu.ppbase.PPDeviceModel
import com.peng.ppscale.vo.LFFoodScaleGeneral

object FoodScaleUtils {

    fun handleScaleData(
        foodScaleGeneral: LFFoodScaleGeneral,
        isStable: Boolean,
        sendEvent: (eventName: String, payload: Map<String, Any>) -> Unit
    ) {
        val thanZero = foodScaleGeneral.thanZero
        var weight = foodScaleGeneral.lfWeightKg.toFloat()

        if (thanZero == 0) {
            weight = -weight
        }

        val unit = FoodScaleUnit.fromRawValue(foodScaleGeneral.unit.name).displayName

        sendEvent(
            "onWeightChange",
            mapOf(
                "weight" to weight,
                "unit" to unit,
                "isStable" to isStable,
                "isTare" to (weight == 0f)
            )
        )
    }
}
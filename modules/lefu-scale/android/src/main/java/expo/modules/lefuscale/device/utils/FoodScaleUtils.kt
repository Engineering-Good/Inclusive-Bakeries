package expo.modules.lefuscale.device.utils

import com.lefu.ppbase.PPDeviceModel
import com.peng.ppscale.vo.LFFoodScaleGeneral

object FoodScaleUtils {

    fun handleScaleData(
        foodScaleGeneral: LFFoodScaleGeneral,
        isStable: Boolean,
        callback: (payload: Map<String, Any>) -> Unit
    ) {
        val thanZero = foodScaleGeneral.thanZero
        var weight = foodScaleGeneral.lfWeightKg.toFloat()

        if (thanZero == 0) {
            weight = -weight
        }

        val unit = FoodScaleUnit.fromRawValue(foodScaleGeneral.unit.name).displayName

        callback(
            mapOf(
                "weight" to weight,
                "unit" to unit,
                "isStable" to isStable,
                "isTare" to (weight == 0f)
            )
        )
    }
}
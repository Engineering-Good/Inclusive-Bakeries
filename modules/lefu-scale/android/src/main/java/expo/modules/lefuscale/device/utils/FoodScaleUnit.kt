package expo.modules.lefuscale.device.utils

enum class FoodScaleUnit(val rawValue: String, val displayName: String) {
    GRAMS("ppunitg", "grams"),
    KILOGRAMS("ppunitkg", "kg"),
    MILLILITERS_WATER("ppunitmlwater", "ml"),
    OUNCES("ppunitoz", "oz"),
    POUNDS("unit_lb", "lb"),
    OUNCESPOUNDS("ppunitlboz", "lb oz"),
    UNKNOWN("unknown", "unknown");

    companion object {
        fun fromRawValue(value: String?): FoodScaleUnit {
            return values().find { it.rawValue.equals(value, ignoreCase = true) } ?: UNKNOWN
        }
    }
}
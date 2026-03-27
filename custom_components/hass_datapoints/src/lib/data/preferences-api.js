/**
 * Preferences data access layer.
 */

export async function fetchUserData(hass, key, defaultValue = null) {
  try {
    const result = await hass.connection.sendMessagePromise({
      type: "frontend/get_user_data",
      key,
    });
    return result?.value ?? defaultValue;
  } catch (err) {
    console.warn("[hass-datapoints] fetchUserData failed:", err);
    return defaultValue;
  }
}

export async function saveUserData(hass, key, value) {
  try {
    await hass.connection.sendMessagePromise({
      type: "frontend/set_user_data",
      key,
      value,
    });
  } catch (err) {
    console.warn("[hass-datapoints] saveUserData failed:", err);
  }
}

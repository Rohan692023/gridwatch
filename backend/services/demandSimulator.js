/**
 * Generates a realistic-ish demand multiplier based on time of day, plus
 * small random noise per zone, so the dashboard has something believable
 * to react to instead of pure random numbers. This is a simulation layer
 * standing in for real smart-meter telemetry.
 */

function timeOfDayMultiplier(date = new Date()) {
  const hour = date.getHours() + date.getMinutes() / 60;

  // Rough double-peak residential/industrial curve:
  // low overnight, morning ramp, midday plateau, evening peak.
  const morningPeak = gaussian(hour, 9, 2.2) * 0.75;
  const eveningPeak = gaussian(hour, 19.5, 2.0) * 1.0;
  const base = 0.35;

  return Math.min(1.4, base + morningPeak + eveningPeak);
}

function gaussian(x, mean, stdDev) {
  const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
  return Math.exp(exponent);
}

function jitter(value, pct = 0.08) {
  const delta = value * pct * (Math.random() * 2 - 1);
  return Math.max(0, value + delta);
}

/**
 * @param {Array} zones - zone docs with baseLoadKw
 * @returns {Map<string, number>} zoneId -> simulated currentLoadKw
 */
function simulateDemand(zones, date = new Date()) {
  const multiplier = timeOfDayMultiplier(date);
  const loads = new Map();
  for (const zone of zones) {
    const load = jitter(zone.baseLoadKw * multiplier);
    loads.set(String(zone._id), Math.round(load * 10) / 10);
  }
  return loads;
}

module.exports = { simulateDemand, timeOfDayMultiplier };

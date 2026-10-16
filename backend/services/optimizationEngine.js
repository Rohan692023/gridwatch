/**
 * Load-Shedding Optimization Engine
 * ---------------------------------
 * Problem: given a set of zones (each with a load and a priority tier) and
 * a supply shortfall, decide which non-critical zones to keep ON so that:
 *   1. Critical zones (priority 1) are never shed.
 *   2. Total ON load never exceeds available supply.
 *   3. Among valid combinations, we keep ON the set that maximizes total
 *      "priority-weighted value" (medium-priority zones are preferred over
 *      low-priority ones when both can't fit).
 *   4. Ties are broken by fairness: the zone with the LESS downtime history
 *      is favored to stay ON (so the same zone isn't punished every cycle).
 *
 * This is a 0/1 knapsack: each non-critical zone is an "item" with
 * weight = load (kW, rounded to the nearest kW) and value = priority
 * weight. We want the max-value subset whose total weight fits the
 * remaining capacity. Solved with a bottom-up DP table, O(n * capacity).
 *
 * Capacity is capped (see MAX_DP_CAPACITY) so the DP table can't blow up
 * memory if someone enters an unrealistic supply value.
 */

const MAX_DP_CAPACITY = 20000; // kW — sane upper bound for a microgrid sim

function priorityValue(priority, totalDowntimeMinutes) {
  // Medium priority (2) is worth more than low priority (3).
  // A small fairness bonus nudges the DP toward zones with less downtime
  // history when values would otherwise tie exactly.
  const base = priority === 2 ? 100 : 10;
  const fairnessBonus = 1 / (1 + totalDowntimeMinutes / 60); // shrinks over time
  return base + fairnessBonus;
}

/**
 * @param {Array} zones - [{ _id, priority, currentLoadKw, totalDowntimeMinutes }]
 * @param {number} availableSupplyKw
 * @returns {{ keepOnIds: string[], shedIds: string[], criticalLoadKw: number }}
 */
function optimizeLoadShedding(zones, availableSupplyKw) {
  const critical = zones.filter((z) => z.priority === 1);
  const nonCritical = zones.filter((z) => z.priority !== 1);

  const criticalLoadKw = critical.reduce((sum, z) => sum + z.currentLoadKw, 0);
  const remainingCapacity = Math.max(
    0,
    Math.min(MAX_DP_CAPACITY, Math.floor(availableSupplyKw - criticalLoadKw))
  );

  // If even critical load exceeds supply, everything non-critical is shed
  // and we flag the deficit — this is a real emergency state, not something
  // the optimizer can solve away.
  if (availableSupplyKw < criticalLoadKw) {
    return {
      keepOnIds: critical.map((z) => String(z._id)),
      shedIds: nonCritical.map((z) => String(z._id)),
      criticalLoadKw,
      criticalOverload: true,
    };
  }

  const n = nonCritical.length;
  const weights = nonCritical.map((z) => Math.max(0, Math.round(z.currentLoadKw)));
  const values = nonCritical.map((z) => priorityValue(z.priority, z.totalDowntimeMinutes));

  // dp[i][w] = max value achievable using first i items within capacity w
  const dp = Array.from({ length: n + 1 }, () => new Float64Array(remainingCapacity + 1));

  for (let i = 1; i <= n; i++) {
    const w_i = weights[i - 1];
    const v_i = values[i - 1];
    for (let w = 0; w <= remainingCapacity; w++) {
      if (w_i <= w) {
        const withItem = dp[i - 1][w - w_i] + v_i;
        const withoutItem = dp[i - 1][w];
        dp[i][w] = withItem > withoutItem ? withItem : withoutItem;
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find which zones are kept ON
  const keepOnSet = new Set();
  let w = remainingCapacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      keepOnSet.add(i - 1);
      w -= weights[i - 1];
    }
  }

  const keepOnIds = [
    ...critical.map((z) => String(z._id)),
    ...nonCritical.filter((_, idx) => keepOnSet.has(idx)).map((z) => String(z._id)),
  ];
  const shedIds = nonCritical
    .filter((_, idx) => !keepOnSet.has(idx))
    .map((z) => String(z._id));

  return { keepOnIds, shedIds, criticalLoadKw, criticalOverload: false };
}

/**
 * Cheaper fallback used only if the DP capacity guard is exceeded — a
 * simple greedy (sort by priority, then by lowest downtime history first)
 * so the system always returns a decision even in a pathological case.
 */
function greedyFallback(zones, availableSupplyKw) {
  const sorted = [...zones].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.totalDowntimeMinutes - b.totalDowntimeMinutes;
  });

  let remaining = availableSupplyKw;
  const keepOnIds = [];
  const shedIds = [];

  for (const z of sorted) {
    if (z.priority === 1 || z.currentLoadKw <= remaining) {
      keepOnIds.push(String(z._id));
      remaining -= z.currentLoadKw;
    } else {
      shedIds.push(String(z._id));
    }
  }

  return { keepOnIds, shedIds, criticalOverload: remaining < 0 };
}

module.exports = { optimizeLoadShedding, greedyFallback, MAX_DP_CAPACITY };

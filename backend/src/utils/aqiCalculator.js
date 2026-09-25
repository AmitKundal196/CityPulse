/**
 * Standard U.S. Air Quality Index (U.S. AQI) Category Resolver.
 * Official Reference: U.S. EPA Air Quality Index (AQI) Standard.
 *
 * Breakpoints:
 * 0–50: Good
 * 51–100: Moderate
 * 101–150: Unhealthy for Sensitive Groups
 * 151–200: Unhealthy
 * 201–300: Very Unhealthy
 * 301–500: Hazardous
 */

function getUsAqiCategory(usAqiVal) {
  if (typeof usAqiVal !== 'number' || isNaN(usAqiVal) || usAqiVal < 0) {
    return {
      category: 'N/A',
      color: 'gray'
    };
  }

  const aqi = Math.round(usAqiVal);

  if (aqi <= 50) {
    return { category: 'Good', color: 'emerald' };
  } else if (aqi <= 100) {
    return { category: 'Moderate', color: 'yellow' };
  } else if (aqi <= 150) {
    return { category: 'Unhealthy for Sensitive Groups', color: 'orange' };
  } else if (aqi <= 200) {
    return { category: 'Unhealthy', color: 'rose' };
  } else if (aqi <= 300) {
    return { category: 'Very Unhealthy', color: 'purple' };
  } else {
    return { category: 'Hazardous', color: 'red' };
  }
}

module.exports = { getUsAqiCategory };


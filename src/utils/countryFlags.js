// Utility function to get country flags based on location names

/**
 * Map country/location names to their respective flag URLs or emoji codes
 * This uses the country code flag emoji format
 */
const countryFlagMap = {
  'Türkiye': 'https://flagcdn.com/w40/tr.png',
  'Turkey': 'https://flagcdn.com/w40/tr.png',
  'İstanbul': 'https://flagcdn.com/w40/tr.png',
  'Ankara': 'https://flagcdn.com/w40/tr.png',
  'İzmir': 'https://flagcdn.com/w40/tr.png',
  'United States': 'https://flagcdn.com/w40/us.png',
  'USA': 'https://flagcdn.com/w40/us.png',
  'United Kingdom': 'https://flagcdn.com/w40/gb.png',
  'UK': 'https://flagcdn.com/w40/gb.png',
  'Germany': 'https://flagcdn.com/w40/de.png',
  'France': 'https://flagcdn.com/w40/fr.png',
  'Italy': 'https://flagcdn.com/w40/it.png',
  'Spain': 'https://flagcdn.com/w40/es.png',
  'Russia': 'https://flagcdn.com/w40/ru.png',
  'Japan': 'https://flagcdn.com/w40/jp.png',
  'China': 'https://flagcdn.com/w40/cn.png',
  'India': 'https://flagcdn.com/w40/in.png',
  'Brazil': 'https://flagcdn.com/w40/br.png',
  'Canada': 'https://flagcdn.com/w40/ca.png',
  'Australia': 'https://flagcdn.com/w40/au.png',
  'Netherlands': 'https://flagcdn.com/w40/nl.png',
  'Belgium': 'https://flagcdn.com/w40/be.png',
  'Sweden': 'https://flagcdn.com/w40/se.png',
  'Norway': 'https://flagcdn.com/w40/no.png',
  'Denmark': 'https://flagcdn.com/w40/dk.png',
  'Finland': 'https://flagcdn.com/w40/fi.png',
  'Greece': 'https://flagcdn.com/w40/gr.png',
  'Portugal': 'https://flagcdn.com/w40/pt.png',
  'Ireland': 'https://flagcdn.com/w40/ie.png',
  'Switzerland': 'https://flagcdn.com/w40/ch.png',
  'Austria': 'https://flagcdn.com/w40/at.png',
  'Poland': 'https://flagcdn.com/w40/pl.png',
  'Hungary': 'https://flagcdn.com/w40/hu.png',
  'Czech Republic': 'https://flagcdn.com/w40/cz.png',
  'Ukraine': 'https://flagcdn.com/w40/ua.png',
};

/**
 * Get country flag URL based on location name
 * @param {string} location - The name of the country or city
 * @returns {string|null} - URL to the country flag image or null if not found
 */
export const getCountryFlag = (location) => {
  if (!location) return null;
  
  // Check if we have a direct match
  if (countryFlagMap[location]) {
    return countryFlagMap[location];
  }
  
  // Check if location contains a country name
  for (const [country, flag] of Object.entries(countryFlagMap)) {
    if (location.includes(country)) {
      return flag;
    }
  }
  
  // If no match is found, return null
  return null;
};

export default getCountryFlag; 
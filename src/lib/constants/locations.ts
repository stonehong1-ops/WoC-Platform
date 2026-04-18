export const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'SEOUL': { lat: 37.5575, lng: 126.9244, zoom: 15 },
  'BUSAN': { lat: 35.1796, lng: 129.0756, zoom: 13 },
  'DAEGU': { lat: 35.8714, lng: 128.6014, zoom: 13 },
  'INCHEON': { lat: 37.4563, lng: 126.7052, zoom: 13 },
  'GWANGJU': { lat: 35.1595, lng: 126.8526, zoom: 13 },
  'DAEJEON': { lat: 36.3504, lng: 127.3845, zoom: 13 },
  'ULSAN': { lat: 35.5384, lng: 129.3114, zoom: 13 },
  'JEJU': { lat: 33.4996, lng: 126.5312, zoom: 11 },
  // Japan
  'JAPAN': { lat: 35.6762, lng: 139.6503, zoom: 6 },
  'TOKYO': { lat: 35.6762, lng: 139.6503, zoom: 12 },
  'OSAKA': { lat: 34.6937, lng: 135.5023, zoom: 12 },
  'FUKUOKA': { lat: 33.5904, lng: 130.4017, zoom: 13 },
  // Taiwan
  'TAIWAN': { lat: 25.0330, lng: 121.5654, zoom: 8 },
  'TAIPEI': { lat: 25.0330, lng: 121.5654, zoom: 13 },
  // Thailand
  'THAILAND': { lat: 13.7563, lng: 100.5018, zoom: 6 },
  'BANGKOK': { lat: 13.7563, lng: 100.5018, zoom: 12 },
  // Singapore
  'SINGAPORE': { lat: 1.3521, lng: 103.8198, zoom: 12 },
  // China / Hong Kong
  'CHINA': { lat: 39.9042, lng: 116.4074, zoom: 4 },
  'HONG KONG': { lat: 22.3193, lng: 114.1694, zoom: 12 },
  'SHANGHAI': { lat: 31.2304, lng: 121.4737, zoom: 12 },
  // Americas
  'USA': { lat: 37.0902, lng: -95.7129, zoom: 4 },
  'NEW YORK': { lat: 40.7128, lng: -74.0060, zoom: 11 },
  'LOS ANGELES': { lat: 34.0522, lng: -118.2437, zoom: 11 },
  'ARGENTINA': { lat: -34.6037, lng: -58.3816, zoom: 5 },
  'BUENOS AIRES': { lat: -34.6037, lng: -58.3816, zoom: 12 },
};

export const DEFAULT_COORDINATES = CITY_COORDINATES['SEOUL'];

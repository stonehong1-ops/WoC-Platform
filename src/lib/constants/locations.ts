export const CITY_COORDINATES: Record<string, { lat: number; lng: number; zoom: number }> = {
  'SEOUL': { lat: 37.5665, lng: 126.9780, zoom: 13 },
  'BUSAN': { lat: 35.1796, lng: 129.0756, zoom: 13 },
  'DAEGU': { lat: 35.8714, lng: 128.6014, zoom: 13 },
  'INCHEON': { lat: 37.4563, lng: 126.7052, zoom: 13 },
  'GWANGJU': { lat: 35.1595, lng: 126.8526, zoom: 13 },
  'DAEJEON': { lat: 36.3504, lng: 127.3845, zoom: 13 },
  'ULSAN': { lat: 35.5384, lng: 129.3114, zoom: 13 },
  'JEJU': { lat: 33.4996, lng: 126.5312, zoom: 11 },
  'TOKYO': { lat: 35.6762, lng: 139.6503, zoom: 12 },
  'OSAKA': { lat: 34.6937, lng: 135.5023, zoom: 12 },
  'FUKUOKA': { lat: 33.5904, lng: 130.4017, zoom: 13 },
  'TAIPEI': { lat: 25.0330, lng: 121.5654, zoom: 13 },
  'BANGKOK': { lat: 13.7563, lng: 100.5018, zoom: 12 },
  'SINGAPORE': { lat: 1.3521, lng: 103.8198, zoom: 12 },
  'HONG KONG': { lat: 22.3193, lng: 114.1694, zoom: 12 },
};

export const DEFAULT_COORDINATES = CITY_COORDINATES['SEOUL'];

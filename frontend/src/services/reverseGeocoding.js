// 위치를 주소로 변환하는 서비스
class ReverseGeocodingService {
  constructor() {
    this.cache = new Map(); // 캐시로 성능 향상
  }

  // 위도/경도를 주소로 변환
  async getAddressFromCoordinates(latitude, longitude) {
    const cacheKey = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    
    // 캐시에서 확인
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Nominatim OpenStreetMap API 사용 (무료)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ko`,
        {
          headers: {
            'User-Agent': 'Atlas-Alert-System/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding API 요청 실패');
      }

      const data = await response.json();
      
      let address = '주소를 찾을 수 없습니다';
      
      if (data && data.display_name) {
        // 한국어 주소 정보 우선 사용
        if (data.address) {
          const addr = data.address;
          const parts = [];
          
          // 한국 주소 형식으로 조합
          if (addr.country) parts.push(addr.country);
          if (addr.state || addr.province) parts.push(addr.state || addr.province);
          if (addr.city || addr.county) parts.push(addr.city || addr.county);
          if (addr.town || addr.municipality) parts.push(addr.town || addr.municipality);
          if (addr.suburb || addr.district) parts.push(addr.suburb || addr.district);
          if (addr.road) parts.push(addr.road);
          if (addr.house_number) parts.push(addr.house_number);
          
          address = parts.join(' ') || data.display_name;
        } else {
          address = data.display_name;
        }
      }

      // 캐시에 저장 (최대 100개)
      if (this.cache.size >= 100) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(cacheKey, address);

      return address;

    } catch (error) {
      console.error('주소 변환 실패:', error);
      return '주소 변환 실패';
    }
  }

  // Google Maps API 대안 (API 키 필요시 사용)
  async getAddressFromGoogleMaps(latitude, longitude, apiKey) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=ko`
      );

      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return '주소를 찾을 수 없습니다';
    } catch (error) {
      console.error('Google Maps API 오류:', error);
      return '주소 변환 실패';
    }
  }

  // 캐시 지우기
  clearCache() {
    this.cache.clear();
  }
}

// 싱글톤 인스턴스
const reverseGeocodingService = new ReverseGeocodingService();
export default reverseGeocodingService;

// 자동 위치 추적 서비스
class LocationTracker {
  constructor() {
    this.watchId = null;
    this.isTracking = false;
    this.lastPosition = null;
    this.updateInterval = 5 * 60 * 1000; // 5분마다 서버로 위치 전송
    this.lastUpdateTime = 0;
  }

  // 위치 권한 확인
  async checkPermission() {
    if (!navigator.geolocation) {
      throw new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state; // 'granted', 'denied', 'prompt'
    } catch (error) {
      console.warn('권한 확인 실패:', error);
      return 'unknown';
    }
  }

  // 현재 위치 한 번 가져오기
  async getCurrentPosition() {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5분 캐시
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          resolve(location);
        },
        (error) => {
          let message = '위치 정보를 가져올 수 없습니다.';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '위치 접근이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              message = '위치 정보 요청이 시간 초과되었습니다.';
              break;
          }
          
          reject(new Error(message));
        },
        options
      );
    });
  }

  // 자동 위치 추적 시작
  async startTracking(onLocationUpdate, onError) {
    try {
      // 권한 확인
      const permission = await this.checkPermission();
      if (permission === 'denied') {
        throw new Error('위치 권한이 거부되었습니다.');
      }

      // 즉시 한 번 위치 가져오기
      try {
        const position = await this.getCurrentPosition();
        this.lastPosition = position;
        await this.sendLocationToServer(position);
        onLocationUpdate && onLocationUpdate(position);
      } catch (error) {
        console.warn('초기 위치 가져오기 실패:', error);
      }

      // 연속 추적 시작
      const options = {
        enableHighAccuracy: false, // 배터리 절약을 위해 정확도 낮춤
        timeout: 30000,
        maximumAge: 60000 // 1분 캐시
      };

      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };

          // 위치가 크게 변경되었거나 일정 시간이 지났을 때만 서버로 전송
          if (this.shouldUpdateServer(location)) {
            try {
              await this.sendLocationToServer(location);
              this.lastPosition = location;
              this.lastUpdateTime = Date.now();
              onLocationUpdate && onLocationUpdate(location);
            } catch (error) {
              console.error('서버 위치 업데이트 실패:', error);
              onError && onError(error);
            }
          }
        },
        (error) => {
          console.error('위치 추적 오류:', error);
          onError && onError(error);
        },
        options
      );

      this.isTracking = true;
      console.log('자동 위치 추적이 시작되었습니다.');

    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
      onError && onError(error);
      throw error;
    }
  }

  // 위치 추적 중지
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    console.log('자동 위치 추적이 중지되었습니다.');
  }

  // 서버 업데이트가 필요한지 확인
  shouldUpdateServer(newLocation) {
    if (!this.lastPosition) return true;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // 5분 이상 지났으면 업데이트
    if (timeSinceLastUpdate >= this.updateInterval) {
      return true;
    }

    // 위치가 100m 이상 변경되었으면 업데이트
    const distance = this.calculateDistance(
      this.lastPosition.latitude,
      this.lastPosition.longitude,
      newLocation.latitude,
      newLocation.longitude
    );
    
    return distance >= 0.1; // 100m
  }

  // 두 지점 간의 거리 계산 (km)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI/180);
  }
  // 서버로 위치 전송
  async sendLocationToServer(location) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      // apiService를 사용하도록 변경
      const apiService = (await import('./api.js')).default;
      
      const result = await apiService.put('/api/alerts/location', {
        latitude: location.latitude,
        longitude: location.longitude
      });

      console.log('위치 업데이트 성공:', result.data);
      return result.data;

    } catch (error) {
      console.error('서버 위치 전송 실패:', error);
      throw error;
    }
  }

  // 현재 추적 상태 반환
  getStatus() {
    return {
      isTracking: this.isTracking,
      lastPosition: this.lastPosition,
      lastUpdateTime: this.lastUpdateTime
    };
  }
}

// 싱글톤 인스턴스
const locationTracker = new LocationTracker();
export default locationTracker;

import React, { useState, useEffect } from 'react';
import { Phone, AlertCircle, MapPin, User, Shield, Siren, Heart, Navigation, Wifi, Battery, Volume2, X } from 'lucide-react';

const SOSComponent = () => {
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState({ lat: 37.5665, lng: 126.9780, address: '서울, 대한민국' });
  const [batteryLevel, setBatteryLevel] = useState(75);
  const [signalStrength, setSignalStrength] = useState(4);
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: '한국 경찰', number: '112', type: 'police' },
    { id: 2, name: '소방서/구급', number: '119', type: 'medical' },
    { id: 3, name: '주한 미국 대사관', number: '02-397-4114', type: 'embassy' },
    { id: 4, name: '관광 통역 안내', number: '1330', type: 'tourism' }
  ]);

  useEffect(() => {
    if (isSOSActive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isSOSActive && countdown === 0) {
      // SOS 발송 로직
      console.log('SOS 발송됨!');
    }
  }, [isSOSActive, countdown]);

  const handleSOSActivate = () => {
    setIsSOSActive(true);
    setCountdown(5);
  };

  const handleSOSCancel = () => {
    setIsSOSActive(false);
    setCountdown(5);
  };

  const getContactIcon = (type) => {
    switch(type) {
      case 'police': return '👮';
      case 'medical': return '🏥';
      case 'embassy': return '🏛️';
      case 'tourism': return '🗺️';
      default: return '📞';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 상태 바 */}
        <div className="mb-8 flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-green-400" />
              <span className="text-sm">{location.address}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Wifi className="w-4 h-4" />
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-${i + 2} ${i < signalStrength ? 'bg-green-400' : 'bg-gray-600'}`}
                />
              ))}
            </div>
            <div className="flex items-center space-x-1">
              <Battery className="w-5 h-5" />
              <span className="text-sm">{batteryLevel}%</span>
            </div>
          </div>
        </div>

        {/* 메인 SOS 버튼 */}
        <div className="mb-12 relative">
          <div className="flex justify-center">
            <button
              onClick={handleSOSActivate}
              disabled={isSOSActive}
              className={`relative w-64 h-64 rounded-full transition-all duration-300 transform ${
                isSOSActive 
                  ? 'scale-110 animate-pulse' 
                  : 'hover:scale-105 active:scale-95'
              }`}
            >
              {/* 배경 애니메이션 */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-pink-600 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-gradient-to-br from-red-500 to-pink-500 rounded-full" />
              <div className="absolute inset-4 bg-gradient-to-br from-red-600 to-pink-600 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <Siren className="w-16 h-16 mb-2 mx-auto" />
                  <span className="text-2xl font-bold">SOS</span>
                  <p className="text-sm opacity-80 mt-1">긴급 도움 요청</p>
                </div>
              </div>
              
              {/* 리플 효과 */}
              {isSOSActive && (
                <>
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping animation-delay-200" />
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping animation-delay-400" />
                </>
              )}
            </button>
          </div>

          {/* 카운트다운 모달 */}
          {isSOSActive && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gray-900 p-8 rounded-2xl border border-red-500 max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="w-32 h-32 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-6xl font-bold text-red-500">{countdown}</span>
                  </div>
                  
                  <h2 className="text-2xl font-bold mb-2">긴급 SOS 발송 중</h2>
                  <p className="text-gray-400 mb-6">
                    {countdown > 0 
                      ? `${countdown}초 후 자동으로 발송됩니다` 
                      : '도움 요청이 전송되었습니다'}
                  </p>
                  
                  <div className="space-y-3 mb-6 text-left bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-green-400" />
                      <span className="text-sm">위치: {location.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-blue-400" />
                      <span className="text-sm">이름: 김여행</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-purple-400" />
                      <span className="text-sm">여행자 ID: ST-2025-0529</span>
                    </div>
                  </div>
                  
                  {countdown > 0 && (
                    <button
                      onClick={handleSOSCancel}
                      className="px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors"
                    >
                      취소
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 긴급 연락처 */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <Phone className="w-6 h-6 mr-2 text-blue-400" />
            긴급 연락처
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyContacts.map((contact) => (
              <div
                key={contact.id}
                className="group p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{getContactIcon(contact.type)}</span>
                    <div>
                      <h3 className="font-semibold">{contact.name}</h3>
                      <p className="text-2xl font-bold text-blue-400">{contact.number}</p>
                    </div>
                  </div>
                  
                  <button className="p-3 bg-blue-500/20 rounded-lg hover:bg-blue-500/30 transition-colors group-hover:scale-110 transform duration-300">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 빠른 도움말 */}
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
            긴급 상황 시 행동 요령
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">침착함 유지</h4>
                  <p className="text-sm text-gray-400">당황하지 말고 상황을 정확히 파악하세요</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">안전한 장소로 이동</h4>
                  <p className="text-sm text-gray-400">위험 지역에서 벗어나 안전한 곳으로 대피하세요</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">도움 요청</h4>
                  <p className="text-sm text-gray-400">SOS 버튼을 누르거나 긴급 연락처로 전화하세요</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-medium mb-1">정보 제공</h4>
                  <p className="text-sm text-gray-400">위치, 상황, 필요한 도움을 명확히 전달하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 추가 기능 버튼들 */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <Heart className="w-8 h-8 mx-auto mb-2 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm">의료 정보</span>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <Navigation className="w-8 h-8 mx-auto mb-2 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm">가까운 병원</span>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <Volume2 className="w-8 h-8 mx-auto mb-2 text-yellow-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm">사이렌</span>
          </button>
          
          <button className="p-4 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 group">
            <Shield className="w-8 h-8 mx-auto mb-2 text-green-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm">대사관 연락</span>
          </button>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
};

export default SOSComponent;
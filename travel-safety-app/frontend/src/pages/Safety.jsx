import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Bell, MapPin, Globe, Activity, TrendingUp, Filter, Search, Clock, Radio, Zap, Eye, ChevronDown, AlertCircle, Info } from 'lucide-react';

const SafetyAlertsPage = () => {
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [showMap, setShowMap] = useState(true);

  // 실시간 알림 시뮬레이션
  const [liveAlerts, setLiveAlerts] = useState([]);
  
  useEffect(() => {
    if (isLiveMode) {
      const interval = setInterval(() => {
        const newAlert = generateRandomAlert();
        setLiveAlerts(prev => [newAlert, ...prev].slice(0, 10));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLiveMode]);

  const generateRandomAlert = () => {
    const alerts = [
      { country: '일본', city: '도쿄', type: '지진', severity: 'high' },
      { country: '태국', city: '방콕', type: '폭우', severity: 'medium' },
      { country: '미국', city: '뉴욕', type: '교통 혼잡', severity: 'low' },
      { country: '프랑스', city: '파리', type: '시위', severity: 'medium' },
      { country: '호주', city: '시드니', type: '산불', severity: 'high' }
    ];
    const random = alerts[Math.floor(Math.random() * alerts.length)];
    return {
      id: Date.now(),
      ...random,
      time: new Date(),
      message: `${random.city}에서 ${random.type} 발생`
    };
  };

  const countries = [
    { code: 'all', name: '전체', flag: '🌍' },
    { code: 'kr', name: '대한민국', flag: '🇰🇷' },
    { code: 'jp', name: '일본', flag: '🇯🇵' },
    { code: 'us', name: '미국', flag: '🇺🇸' },
    { code: 'fr', name: '프랑스', flag: '🇫🇷' },
    { code: 'th', name: '태국', flag: '🇹🇭' }
  ];

  const safetyAlerts = [
    {
      id: 1,
      country: '일본',
      city: '도쿄',
      flag: '🇯🇵',
      severity: 'medium',
      type: '자연재해',
      title: '태풍 10호 접근 중',
      description: '강한 바람과 폭우가 예상됩니다. 야외 활동을 자제하시기 바랍니다.',
      time: '2시간 전',
      affectedAreas: ['시부야', '신주쿠', '롯폰기'],
      recommendations: ['실내 대피', '비상용품 준비', '항공편 확인']
    },
    {
      id: 2,
      country: '프랑스',
      city: '파리',
      flag: '🇫🇷',
      severity: 'high',
      type: '사회불안',
      title: '대규모 시위 예정',
      description: '샹젤리제 거리에서 대규모 시위가 예정되어 있습니다.',
      time: '5시간 전',
      affectedAreas: ['샹젤리제', '콩코르드 광장', '개선문'],
      recommendations: ['해당 지역 회피', '대중교통 이용 주의', '숙소 확인']
    },
    {
      id: 3,
      country: '태국',
      city: '방콕',
      flag: '🇹🇭',
      severity: 'low',
      type: '기상',
      title: '몬순 시즌 시작',
      description: '우기가 시작되어 간헐적인 폭우가 예상됩니다.',
      time: '1일 전',
      affectedAreas: ['수완나품 공항', '카오산 로드', '왕궁'],
      recommendations: ['우산 지참', '방수 가방 사용', '여유있는 일정 계획']
    }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityGradient = (severity) => {
    switch(severity) {
      case 'high': return 'from-red-500/20 to-orange-500/20';
      case 'medium': return 'from-yellow-500/20 to-amber-500/20';
      case 'low': return 'from-blue-500/20 to-cyan-500/20';
      default: return 'from-gray-500/20 to-gray-600/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            전 세계 안전 정보
          </h1>
          <p className="text-gray-400">실시간으로 업데이트되는 여행지 안전 정보를 확인하세요</p>
        </div>

        {/* 실시간 상태 표시 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isLiveMode 
                  ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30' 
                  : 'bg-gray-800/50 border border-gray-700'
              }`}
            >
              <Radio className={`w-4 h-4 ${isLiveMode ? 'animate-pulse' : ''}`} />
              <span>{isLiveMode ? 'LIVE' : 'OFFLINE'}</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span>마지막 업데이트: 방금 전</span>
            </div>
          </div>

          <button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            <span>{showMap ? '지도 숨기기' : '지도 보기'}</span>
          </button>
        </div>

        {/* 필터 섹션 */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="국가 또는 도시 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            {countries.map(country => (
              <option key={country.code} value={country.code}>
                {country.flag} {country.name}
              </option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
          >
            <option value="all">모든 위험도</option>
            <option value="high">🔴 높음</option>
            <option value="medium">🟡 보통</option>
            <option value="low">🔵 낮음</option>
          </select>

          <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
            <Filter className="w-5 h-5" />
            <span>필터 적용</span>
          </button>
        </div>

        {/* 지도 섹션 */}
        {showMap && (
          <div className="mb-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
            <div className="relative h-96 bg-gray-800/30 rounded-xl overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-20 h-20 text-gray-700 animate-pulse" />
              </div>
              
              {/* 실시간 알림 마커 */}
              {liveAlerts.slice(0, 5).map((alert, index) => (
                <div
                  key={alert.id}
                  className="absolute animate-ping"
                  style={{
                    top: `${20 + Math.random() * 60}%`,
                    left: `${10 + Math.random() * 80}%`,
                    animationDuration: '2s'
                  }}
                >
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 실시간 알림 피드 */}
        {isLiveMode && liveAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-400 animate-pulse" />
              실시간 알림
            </h2>
            <div className="space-y-2">
              {liveAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center space-x-4 p-4 bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-800 animate-slideIn"
                >
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity)} animate-pulse`} />
                  <span className="text-2xl">{alert.country === '일본' ? '🇯🇵' : alert.country === '태국' ? '🇹🇭' : alert.country === '미국' ? '🇺🇸' : alert.country === '프랑스' ? '🇫🇷' : '🇦🇺'}</span>
                  <div className="flex-1">
                    <span className="font-medium">{alert.message}</span>
                    <span className="text-sm text-gray-400 ml-2">{alert.time.toLocaleTimeString('ko-KR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 안전 알림 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {safetyAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`group relative bg-gradient-to-br ${getSeverityGradient(alert.severity)} backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:border-gray-700 transition-all duration-300 hover:transform hover:scale-[1.02]`}
            >
              <div className="absolute top-4 right-4">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)} animate-pulse`} />
              </div>

              <div className="flex items-start space-x-4 mb-4">
                <span className="text-4xl">{alert.flag}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">{alert.title}</h3>
                  <p className="text-gray-400 text-sm">{alert.country} • {alert.city} • {alert.type}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-4">{alert.description}</p>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">영향 지역</h4>
                  <div className="flex flex-wrap gap-2">
                    {alert.affectedAreas.map((area, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-800/50 rounded-full text-sm">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-1">권장 사항</h4>
                  <div className="space-y-1">
                    {alert.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
                <span className="text-sm text-gray-400">{alert.time}</span>
                <button className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">자세히 보기</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 스타일 정의 */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SafetyAlertsPage;
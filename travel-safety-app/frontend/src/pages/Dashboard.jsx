import React, { useState, useEffect } from 'react';
import { Shield, MapPin, AlertTriangle, Phone, Calendar, Globe, Activity, TrendingUp, Navigation, Bell, Settings, LogOut, ChevronRight, Zap, Users, Clock, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [notifications, setNotifications] = useState(3);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const upcomingTrips = [
    {
      id: 1,
      destination: "도쿄, 일본",
      date: "2025.06.15 - 06.22",
      daysLeft: 17,
      safetyScore: 92,
      flag: "🇯🇵"
    },
    {
      id: 2,
      destination: "파리, 프랑스",
      date: "2025.07.10 - 07.20",
      daysLeft: 42,
      safetyScore: 88,
      flag: "🇫🇷"
    }
  ];

  const recentAlerts = [
    {
      id: 1,
      type: "warning",
      location: "태국 방콕",
      message: "우기 시즌 - 홍수 주의보 발령",
      time: "2시간 전",
      severity: "medium"
    },
    {
      id: 2,
      type: "info",
      location: "미국 뉴욕",
      message: "지하철 운행 일시 중단 (23번가역)",
      time: "5시간 전",
      severity: "low"
    },
    {
      id: 3,
      type: "danger",
      location: "필리핀 마닐라",
      message: "태풍 경보 - 야외활동 자제 권고",
      time: "1일 전",
      severity: "high"
    }
  ];

  const safetyStats = [
    { label: "안전 점수", value: 94, change: +2.3, icon: <Shield className="w-5 h-5" /> },
    { label: "방문 국가", value: 12, change: +1, icon: <Globe className="w-5 h-5" /> },
    { label: "안전 경로", value: 156, change: +23, icon: <Navigation className="w-5 h-5" /> },
    { label: "알림 수신", value: 89, change: +15, icon: <Bell className="w-5 h-5" /> }
  ];

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'from-red-500 to-orange-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'low': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 사이드바 */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">SafeTravel</span>
          </div>

          <nav className="space-y-2">
            {[
              { icon: <Activity />, label: "대시보드", active: true },
              { icon: <MapPin />, label: "여행 일정", count: 2 },
              { icon: <Shield />, label: "안전 정보" },
              { icon: <Phone />, label: "긴급 연락처" },
              { icon: <CheckCircle />, label: "체크리스트" },
              { icon: <Settings />, label: "설정" }
            ].map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  item.active 
                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30' 
                    : 'hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={item.active ? 'text-blue-400' : 'text-gray-400'}>
                    {item.icon}
                  </span>
                  <span className={item.active ? 'font-medium' : ''}>{item.label}</span>
                </div>
                {item.count && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button className="w-full flex items-center space-x-3 p-3 hover:bg-gray-800/50 rounded-lg transition-all duration-200">
            <LogOut className="w-5 h-5 text-gray-400" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="ml-64 p-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">안녕하세요, 김여행님! 👋</h1>
            <p className="text-gray-400">오늘도 안전한 여행되세요</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right mr-4">
              <div className="text-sm text-gray-400">현재 시각</div>
              <div className="text-xl font-medium">{currentTime.toLocaleTimeString('ko-KR')}</div>
            </div>
            
            <button className="relative p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {safetyStats.map((stat, index) => (
            <div
              key={index}
              className="group relative p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-800 hover:border-gray-700 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className={`text-sm ${stat.change > 0 ? 'text-green-400' : 'text-red-400'} flex items-center`}>
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </div>
              </div>
              
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
              
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-2xl" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 예정된 여행 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                  예정된 여행
                </h2>
                <button className="text-blue-400 hover:text-blue-300 transition-colors">
                  전체 보기
                </button>
              </div>

              <div className="space-y-4">
                {upcomingTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="group p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl">{trip.flag}</div>
                        <div>
                          <h3 className="font-medium text-lg">{trip.destination}</h3>
                          <p className="text-gray-400 text-sm">{trip.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-gray-400">안전 점수</div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                                style={{ width: `${trip.safetyScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{trip.safetyScore}%</span>
                          </div>
                        </div>
                        
                        <div className="text-center px-4 py-2 bg-blue-500/20 rounded-lg">
                          <div className="text-2xl font-bold text-blue-400">{trip.daysLeft}</div>
                          <div className="text-xs text-gray-400">일 남음</div>
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 최근 안전 알림 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                  최근 안전 알림
                </h2>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                  실시간
                </span>
              </div>

              <div className="space-y-4">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-all duration-300"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getSeverityColor(alert.severity)} mt-2`} />
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{alert.location}</h4>
                        <p className="text-sm text-gray-400 mb-2">{alert.message}</p>
                        <span className="text-xs text-gray-500">{alert.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 실시간 지도 섹션 */}
        <div className="mt-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center">
              <Globe className="w-5 h-5 mr-2 text-green-400" />
              전 세계 안전 현황
            </h2>
            <div className="flex space-x-2">
              {['day', 'week', 'month'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                    selectedPeriod === period
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                  }`}
                >
                  {period === 'day' ? '일간' : period === 'week' ? '주간' : '월간'}
                </button>
              ))}
            </div>
          </div>

          {/* 지도 플레이스홀더 */}
          <div className="relative h-96 bg-gray-800/30 rounded-xl overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">인터랙티브 지도가 여기에 표시됩니다</p>
              </div>
            </div>
            
            {/* 샘플 위치 마커 */}
            {[
              { top: '30%', left: '20%', status: 'safe' },
              { top: '45%', left: '60%', status: 'warning' },
              { top: '60%', left: '40%', status: 'danger' },
              { top: '25%', left: '75%', status: 'safe' },
            ].map((marker, index) => (
              <div
                key={index}
                className="absolute"
                style={{ top: marker.top, left: marker.left }}
              >
                <div className="relative">
                  <div className={`w-4 h-4 rounded-full ${
                    marker.status === 'safe' ? 'bg-green-500' :
                    marker.status === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div className={`absolute inset-0 rounded-full animate-ping ${
                    marker.status === 'safe' ? 'bg-green-500' :
                    marker.status === 'warning' ? 'bg-yellow-500' :
                    'bg-red-500'
                  } opacity-50`} />
                </div>
              </div>
            ))}
          </div>

          {/* 범례 */}
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-400">안전</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-400">주의</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-400">위험</span>
            </div>
          </div>
        </div>

        {/* 빠른 실행 버튼들 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { icon: <Phone className="w-6 h-6" />, label: "긴급 SOS", color: "from-red-500 to-pink-500" },
            { icon: <MapPin className="w-6 h-6" />, label: "안전 경로 찾기", color: "from-blue-500 to-cyan-500" },
            { icon: <Shield className="w-6 h-6" />, label: "안전 점검", color: "from-green-500 to-emerald-500" },
            { icon: <Zap className="w-6 h-6" />, label: "실시간 알림", color: "from-purple-500 to-pink-500" }
          ].map((action, index) => (
            <button
              key={index}
              className="group p-6 bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:transform hover:scale-105"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
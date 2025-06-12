import React, { useState } from 'react';
import NotificationModal from '../components/NotificationModal';
import { motion } from 'framer-motion';

const NotificationTestPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // 테스트용 알림 데이터
  const testNotifications = [
    {
      id: '1',
      type: 'warning',
      title: '🟠 위험 알림: 살인',
      message: '주변 지역에서 위험 상황이 감지되었습니다.',
      created_at: new Date().toISOString(),
      read: false,
      priority: 'medium',
      data: {
        severity: 'medium',
        location: 'Tokyo',
        distance: 2.5,
        categories: ['Crime'],
        keywords: ['murder', 'weapom'],
        news_title: '야스쿠니 거리 인근 골목서 28세 남성 흉기 피습 후 사망…경찰, CCTV 분석 중',
        news_content: '2025년 6월 14일 이른 새벽, 도쿄 중심부 야스쿠니 거리 인근의 희미하게 불이 켜진 골목에서 28세 남성이 숨진 채 발견되었습니다. 수사당국에 따르면 피해자는 현장에서 회수된 소형 접이식 칼에 의한 것으로 보이는 여러 차례의 찔림 상처를 입어 사전 계획된 흉기 공격이 의심됩니다. 목격자들은 범행 직후 어두운 옷을 입은 용의자가 도보로 도주하는 장면을 목격했다고 진술했습니다. 도쿄도경찰청은 이를 살인 사건으로 분류하고 주변 CCTV 영상을 검토해 용의자 신원을 파악 중이며, 인근 주민들에게 의심스러운 활동이나 흉기 발견 시 인근 경찰 초소(코반)에 즉시 신고해 줄 것을 당부했습니다.',
        source: 'Tokyo Daily',
        news_url: '원문보기',
        published: '2024-12-15T14:30:00Z',
        alert_time: new Date().toISOString()
      }
    },
    {
      id: '2',
      type: 'warning',
      title: '🟠 날씨 경보',
      message: '강풍과 폭우가 예상됩니다. 외출 시 주의하세요.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      priority: 'medium',
      data: {
        severity: 'medium',
        location: 'Seoul Metropolitan Area',
        weather_type: 'storm',
        wind_speed: '65km/h',
        rainfall: '50mm/h'
      }
    },
    {
      id: '3',
      type: 'info',
      title: '📢 시스템 업데이트',
      message: '새로운 기능이 추가되었습니다.',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      priority: 'normal',
      data: {
        version: '2.1.0',
        features: ['알림 모달', '향상된 UI', '성능 개선']
      }
    }
  ];

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>알림 모달 테스트</h1>
      <p>아래 알림들을 클릭하여 모달 팝업을 확인해보세요.</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
        {testNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleNotificationClick(notification)}
            style={{
              border: '1px solid #e5e5e5',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              background: notification.read ? '#f9f9f9' : '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                fontSize: '24px',
                color: notification.type === 'danger' ? '#ef4444' : 
                       notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
              }}>
                {notification.type === 'danger' ? '🚨' : 
                 notification.type === 'warning' ? '⚠️' : 'ℹ️'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>
                  {notification.title}
                </h3>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  {notification.message}
                </p>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {new Date(notification.created_at).toLocaleString('ko-KR')}
                </div>
              </div>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: notification.read ? '#ccc' : '#ef4444' 
              }} />
            </div>
          </motion.div>
        ))}
      </div>

      <NotificationModal
        notification={selectedNotification}
        isOpen={showModal}
        onClose={closeModal}
      />

      <div style={{ marginTop: '40px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>테스트 안내</h3>
        <ul>
          <li>각 알림을 클릭하면 상세 모달이 열립니다</li>
          <li>위험 알림(빨간색)은 가장 많은 상세 정보를 포함합니다</li>
          <li>모달 외부 클릭 또는 닫기 버튼으로 모달을 닫을 수 있습니다</li>
          <li>키워드, 카테고리, 뉴스 링크 등의 정보를 확인할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTestPage;

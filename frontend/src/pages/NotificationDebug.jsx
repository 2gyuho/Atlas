import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

const NotificationDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    const info = {
      timestamp: new Date().toISOString(),
      user: !!user,
      userEmail: user?.email,
      token: !!localStorage.getItem('token'),
      apiBaseUrl: apiService.defaults?.baseURL || 'unknown'
    };

    try {
      // 1. 읽지 않은 알림 개수 확인
      console.log('Debug: 읽지 않은 알림 개수 확인 시작');
      const unreadResponse = await apiService.get('/api/notifications/unread-count');
      info.unreadCount = unreadResponse.data;
      console.log('Debug: 읽지 않은 알림 개수', unreadResponse.data);

      // 2. 알림 목록 조회
      console.log('Debug: 알림 목록 조회 시작');
      const notificationsResponse = await apiService.get('/api/notifications?limit=5');
      info.notifications = notificationsResponse.data;
      console.log('Debug: 알림 목록', notificationsResponse.data);

      // 3. 테스트 알림 생성
      console.log('Debug: 테스트 알림 생성 시작');
      const testResponse = await apiService.post('/api/notifications/test');
      info.testNotification = testResponse.data;
      console.log('Debug: 테스트 알림 생성 결과', testResponse.data);

      // 4. 다시 읽지 않은 알림 개수 확인
      setTimeout(async () => {
        const updatedUnreadResponse = await apiService.get('/api/notifications/unread-count');
        info.updatedUnreadCount = updatedUnreadResponse.data;
        setDebugInfo({ ...info });
        console.log('Debug: 업데이트된 읽지 않은 알림 개수', updatedUnreadResponse.data);
      }, 1000);

    } catch (error) {
      console.error('Debug: 오류 발생', error);
      info.error = {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }

    setDebugInfo(info);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      runDebugTest();
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: '20px' }}>
        <Card>
          <h2>알림 시스템 디버그</h2>
          <p>로그인이 필요합니다.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <h2>🔧 알림 시스템 디버그</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <Button onClick={runDebugTest} loading={loading}>
            디버그 테스트 실행
          </Button>
        </div>

        {Object.keys(debugInfo).length > 0 && (
          <div>
            <h3>디버그 정보</h3>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '15px', 
              borderRadius: '5px',
              overflow: 'auto',
              fontSize: '12px'
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div style={{ marginTop: '20px' }}>
          <h3>사용법</h3>
          <ol>
            <li>이 페이지를 열면 자동으로 디버그 테스트가 실행됩니다.</li>
            <li>개발자 도구 콘솔(F12)을 열어서 상세 로그를 확인하세요.</li>
            <li>"디버그 테스트 실행" 버튼을 클릭하여 수동으로 테스트할 수 있습니다.</li>
            <li>위의 JSON 결과에서 API 응답을 확인하세요.</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default NotificationDebug;

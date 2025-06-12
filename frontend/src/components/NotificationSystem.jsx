import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiAlertTriangle, FiInfo, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import NotificationModal from './NotificationModal';
import './NotificationSystem.css';

const NotificationSystem = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const pollingRef = useRef(null);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  // 컴포넌트 마운트 시 로그
  useEffect(() => {
    console.log('NotificationSystem 컴포넌트 마운트됨', { user: !!user });
  }, []);

  // 사용자 상태 변경 시 로그
  useEffect(() => {
    console.log('NotificationSystem 사용자 상태 변경', { user: !!user, email: user?.email });
  }, [user]);

  // 알림 아이콘 매핑
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'danger':
        return <FiAlertTriangle />;
      case 'warning':
        return <FiAlertCircle />;
      case 'success':
        return <FiCheck />;
      case 'info':
      default:
        return <FiInfo />;
    }
  };

  // 알림 우선순위에 따른 색상
  const getNotificationColor = (type, priority) => {
    if (type === 'danger' || priority === 'high') return 'var(--error)';
    if (type === 'warning') return 'var(--warning)';
    if (type === 'success') return 'var(--success)';
    return 'var(--primary-color)';
  };
  // 알림 목록 조회
  const fetchNotifications = async (unreadOnly = false) => {
    if (!user) {
      console.log('NotificationSystem: 사용자가 로그인하지 않았습니다.');
      return;
    }

    console.log('NotificationSystem: 알림 목록 조회 시작', { unreadOnly });
    try {
      const response = await apiService.get(`/api/notifications?unread_only=${unreadOnly}&limit=20`);
      console.log('NotificationSystem: 알림 조회 응답', response.data);
      if (response.data) {
        setNotifications(response.data);
        console.log('NotificationSystem: 알림 상태 업데이트 완료', response.data.length);
      }
    } catch (error) {
      console.error('NotificationSystem: 알림 조회 실패:', error);
    }
  };

  // 읽지 않은 알림 개수 조회
  const fetchUnreadCount = async () => {
    if (!user) {
      console.log('NotificationSystem: 사용자가 로그인하지 않았습니다. (unread count)');
      return;
    }

    console.log('NotificationSystem: 읽지 않은 알림 개수 조회 시작');
    try {
      const response = await apiService.get('/api/notifications/unread-count');
      console.log('NotificationSystem: 읽지 않은 알림 개수 응답', response.data);
      if (response.data) {
        setUnreadCount(response.data.unread_count);
        console.log('NotificationSystem: 읽지 않은 알림 개수 업데이트', response.data.unread_count);
      }
    } catch (error) {
      console.error('NotificationSystem: 읽지 않은 알림 개수 조회 실패:', error);
    }
  };

  // 알림을 읽음으로 표시
  const markAsRead = async (notificationId) => {
    try {
      await apiService.post('/api/notifications/mark-read', {
        notification_id: notificationId
      });
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      // 읽지 않은 개수 업데이트
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 모든 알림을 읽음으로 표시
  const markAllAsRead = async () => {
    try {
      await apiService.post('/api/notifications/mark-all-read');
      
      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };
  // 알림 삭제
  const deleteNotification = async (notificationId) => {
    try {
      await apiService.delete(`/api/notifications/${notificationId}`);
      
      // 로컬 상태에서 제거
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // 알림 클릭 시 모달 열기
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setShowModal(true);
    
    // 읽지 않은 알림이라면 읽음으로 표시
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setSelectedNotification(null);
  };
  // 테스트 알림 생성
  const createTestNotification = async () => {
    console.log('NotificationSystem: 테스트 알림 생성 시작');
    try {
      const response = await apiService.post('/api/notifications/test');
      console.log('NotificationSystem: 테스트 알림 생성 응답', response.data);
      
      // 알림 목록 새로고침
      setTimeout(() => {
        console.log('NotificationSystem: 테스트 알림 생성 후 데이터 새로고침');
        fetchNotifications();
        fetchUnreadCount();
      }, 1000);
    } catch (error) {
      console.error('NotificationSystem: 테스트 알림 생성 실패:', error);
    }
  };
  // 폴링으로 새 알림 확인 (30초마다)
  useEffect(() => {
    console.log('NotificationSystem useEffect 실행', { user: !!user, showNotifications });
    if (!user) {
      console.log('NotificationSystem: 사용자 없음, useEffect 종료');
      return;
    }

    const startPolling = () => {
      console.log('NotificationSystem: 폴링 시작');
      pollingRef.current = setInterval(async () => {
        console.log('NotificationSystem: 폴링 실행 중...');
        await fetchUnreadCount();
        
        // 현재 알림 패널이 열려있으면 알림 목록도 새로고침
        if (showNotifications) {
          console.log('NotificationSystem: 알림 패널이 열려있어서 목록도 새로고침');
          await fetchNotifications();
        }
      }, 30000); // 30초마다
    };

    // 초기 데이터 로드
    console.log('NotificationSystem: 초기 데이터 로드 시작');
    fetchUnreadCount();
    if (showNotifications) {
      console.log('NotificationSystem: 알림 패널이 열려있어서 알림 목록 로드');
      fetchNotifications();
    }

    // 폴링 시작
    startPolling();

    return () => {
      console.log('NotificationSystem: useEffect cleanup');
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [user, showNotifications]);
  // 알림 패널 토글
  const toggleNotifications = async () => {
    console.log('NotificationSystem: 알림 패널 토글', { 현재상태: showNotifications, 새상태: !showNotifications });
    setShowNotifications(!showNotifications);
    
    if (!showNotifications) {
      console.log('NotificationSystem: 알림 패널 열기 - 알림 목록 로드 시작');
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
      console.log('NotificationSystem: 알림 패널 열기 - 알림 목록 로드 완료');
    }
  };

  // 로그인하지 않은 사용자는 알림 시스템 숨김
  if (!user) return null;

  return (
    <div className="notification-system">
      {/* 알림 벨 아이콘 */}
      <div className="notification-bell" onClick={toggleNotifications}>
        <FiBell className="bell-icon" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="notification-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </div>

      {/* 알림 패널 */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="notification-panel"
          >
            <div className="notification-header">
              <h3>알림</h3>
              <div className="notification-actions">
                <button 
                  onClick={createTestNotification}
                  className="test-btn"
                  title="테스트 알림 생성"
                >
                  🧪
                </button>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="mark-all-read-btn"
                    title="모두 읽음"
                  >
                    <FiCheck />
                  </button>
                )}
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="close-btn"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="notification-content">
              {loading ? (
                <div className="notification-loading">
                  <div className="loading-spinner"></div>
                  <span>알림을 불러오는 중...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="no-notifications">
                  <FiBell className="empty-icon" />
                  <p>새로운 알림이 없습니다</p>
                </div>
              ) : (                <div className="notification-list">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      style={{
                        '--notification-color': getNotificationColor(notification.type, notification.priority)
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="notification-body">
                        <div className="notification-title">
                          {notification.title}
                        </div>
                        <div className="notification-message">
                          {notification.message}
                        </div>
                        <div className="notification-time">
                          {new Date(notification.created_at).toLocaleString('ko-KR')}
                        </div>
                        
                        {/* 위험 알림의 경우 추가 정보 표시 */}
                        {notification.type === 'danger' && notification.data && (
                          <div className="danger-details">
                            <div className="danger-location">
                              📍 {notification.data.location}
                            </div>
                            {notification.data.distance && (
                              <div className="danger-distance">
                                📏 {notification.data.distance.toFixed(1)}km 거리
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="notification-controls">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="mark-read-btn"
                            title="읽음으로 표시"
                          >
                            <FiCheck />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="delete-btn"
                          title="삭제"
                        >
                          <FiX />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>          </motion.div>
        )}
      </AnimatePresence>

      {/* 알림 상세 모달 */}
      <NotificationModal
        notification={selectedNotification}
        isOpen={showModal}
        onClose={closeModal}
      />
    </div>
  );
};

export default NotificationSystem;

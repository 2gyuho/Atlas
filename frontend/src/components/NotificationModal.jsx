import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle, FiInfo, FiAlertCircle, FiCheck, FiExternalLink, FiMapPin, FiClock, FiTag } from 'react-icons/fi';
import './NotificationModal.css';

const NotificationModal = ({ notification, isOpen, onClose }) => {
  if (!notification) return null;

  // 알림 타입별 아이콘
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'danger':
        return <FiAlertTriangle className="modal-type-icon danger" />;
      case 'warning':
        return <FiAlertCircle className="modal-type-icon warning" />;
      case 'success':
        return <FiCheck className="modal-type-icon success" />;
      case 'info':
      default:
        return <FiInfo className="modal-type-icon info" />;
    }
  };

  // 위험도별 색상 클래스
  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      case 'low':
        return 'severity-low';
      default:
        return 'severity-unknown';
    }
  };

  // 위험도별 이모지
  const getSeverityEmoji = (severity) => {
    switch (severity) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const data = notification.data || {};

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="notification-modal-backdrop"
            onClick={onClose}
          />          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="notification-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="modal-header">
              <div className="modal-header-left">
                {getNotificationIcon(notification.type)}
                <div className="modal-header-info">
                  <h2 className="modal-title">{notification.title}</h2>
                  <div className="modal-meta">
                    <FiClock className="meta-icon" />
                    <span>{new Date(notification.created_at).toLocaleString('ko-KR')}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="modal-close-btn"
                aria-label="모달 닫기"
              >
                <FiX />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="modal-body">
              {/* 기본 메시지 */}
              <div className="modal-message">
                <p>{notification.message}</p>
              </div>

              {/* 위험 알림의 경우 상세 정보 */}
              {notification.type === 'danger' && data && (
                <div className="danger-details-modal">
                  {/* 위험도 정보 */}
                  {data.severity && (
                    <div className={`severity-info ${getSeverityClass(data.severity)}`}>
                      <span className="severity-emoji">{getSeverityEmoji(data.severity)}</span>
                      <span className="severity-label">위험도: {data.severity.toUpperCase()}</span>
                    </div>
                  )}

                  {/* 위치 정보 */}
                  {data.location && (
                    <div className="detail-item">
                      <FiMapPin className="detail-icon" />
                      <div className="detail-content">
                        <strong>위치</strong>
                        <span>{data.location}</span>
                      </div>
                    </div>
                  )}

                  {/* 거리 정보 */}
                  {data.distance && (
                    <div className="detail-item">
                      <FiMapPin className="detail-icon" />
                      <div className="detail-content">
                        <strong>거리</strong>
                        <span>{data.distance.toFixed(1)}km</span>
                      </div>
                    </div>
                  )}

                  {/* 카테고리 정보 */}
                  {data.categories && data.categories.length > 0 && (
                    <div className="detail-item">
                      <FiTag className="detail-icon" />
                      <div className="detail-content">
                        <strong>카테고리</strong>
                        <div className="categories">
                          {data.categories.map((category, index) => (
                            <span key={index} className="category-tag">
                              {category.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 키워드 정보 */}
                  {data.keywords && data.keywords.length > 0 && (
                    <div className="detail-item">
                      <FiTag className="detail-icon" />
                      <div className="detail-content">
                        <strong>감지된 키워드</strong>
                        <div className="keywords">
                          {data.keywords.map((keyword, index) => (
                            <span key={index} className="keyword-tag">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 뉴스 제목 */}
                  {data.news_title && (
                    <div className="detail-item">
                      <FiInfo className="detail-icon" />
                      <div className="detail-content">
                        <strong>뉴스 제목</strong>
                        <span>{data.news_title}</span>
                      </div>
                    </div>
                  )}

                  {/* 뉴스 내용 (일부) */}
                  {data.news_content && (
                    <div className="detail-item">
                      <FiInfo className="detail-icon" />
                      <div className="detail-content">
                        <strong>뉴스 내용</strong>
                        <p className="news-content">{data.news_content}</p>
                      </div>
                    </div>
                  )}

                  {/* 뉴스 출처 */}
                  {data.source && (
                    <div className="detail-item">
                      <FiInfo className="detail-icon" />
                      <div className="detail-content">
                        <strong>출처</strong>
                        <span>{data.source}</span>
                      </div>
                    </div>
                  )}

                  {/* 뉴스 링크 */}
                  {data.news_url && (
                    <div className="detail-item">
                      <FiExternalLink className="detail-icon" />
                      <div className="detail-content">
                        <strong>원문 보기</strong>
                        <a 
                          href={data.news_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="news-link"
                        >
                          뉴스 전문 읽기
                          <FiExternalLink className="external-icon" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 일반 알림의 경우 추가 데이터 표시 */}
              {notification.type !== 'danger' && data && Object.keys(data).length > 0 && (
                <div className="additional-data">
                  <h4>추가 정보</h4>
                  <div className="data-grid">
                    {Object.entries(data).map(([key, value]) => (
                      <div key={key} className="data-item">
                        <strong>{key}:</strong>
                        <span>{typeof value === 'object' ? JSON.stringify(value) : value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="modal-footer">
              <div className="modal-footer-info">
                <span className={`notification-type-badge ${notification.type}`}>
                  {notification.type}
                </span>
                {notification.priority && (
                  <span className={`priority-badge ${notification.priority}`}>
                    {notification.priority} 우선순위
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="modal-close-button"
              >
                닫기
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;

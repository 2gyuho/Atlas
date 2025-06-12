import React, { useState } from 'react';
import { 
  FiSend, FiUsers, FiMapPin, FiMail, FiBell, 
  FiAlertTriangle, FiInfo, FiTarget, FiCheckCircle 
} from 'react-icons/fi';
import Card from '../components/Card';
import apiService from '../services/api';
import './AdminNotification.css';

const AdminNotification = ({ onBack }) => {
  const [formData, setFormData] = useState({
    recipient_type: 'all',
    user_ids: '',
    location_latitude: '',
    location_longitude: '',
    radius_km: '10',
    alert_type: 'both',
    danger_type: 'admin_notice',
    title: '',
    message: '',
    location_name: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // 데이터 준비
      const requestData = {
        ...formData,
        user_ids: formData.user_ids ? formData.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : null,
        location_latitude: formData.location_latitude ? parseFloat(formData.location_latitude) : null,
        location_longitude: formData.location_longitude ? parseFloat(formData.location_longitude) : null,
        radius_km: formData.radius_km ? parseFloat(formData.radius_km) : null
      };

      const response = await apiService.post('/api/admin/send-notification', requestData);
      setResult({
        success: true,
        data: response.data
      });
    } catch (error) {
      setResult({
        success: false,
        error: error.response?.data?.detail || '알림 발송에 실패했습니다.'
      });
    } finally {
      setLoading(false);
    }
  };

  const recipientTypes = [
    { value: 'all', label: '모든 사용자', icon: FiUsers },
    { value: 'specific', label: '특정 사용자', icon: FiTarget },
    { value: 'location_based', label: '위치 기반', icon: FiMapPin }
  ];
  const alertTypes = [
    { value: 'email', label: '이메일만', icon: FiMail },
    { value: 'web', label: '웹 알림만', icon: FiBell },
    { value: 'both', label: '이메일 + 웹 알림', icon: FiSend }
  ];

  const dangerTypes = [
    { value: 'admin_notice', label: '공지사항', color: '#6366f1' },
    { value: 'emergency', label: '긴급상황', color: '#ef4444' },
    { value: 'warning', label: '경고', color: '#f59e0b' },
    { value: 'info', label: '정보', color: '#10b981' }
  ];

  return (
    <div className="admin-notification">
      <div className="notification-header">
        <button onClick={onBack} className="back-btn">
          ← 돌아가기
        </button>
        <h1><FiSend /> 관리자 알림 발송</h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="notification-form">
          {/* 수신자 유형 */}
          <div className="form-section">
            <h3><FiUsers /> 수신자 선택</h3>
            <div className="recipient-types">
              {recipientTypes.map(type => (
                <label key={type.value} className={`recipient-option ${formData.recipient_type === type.value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="recipient_type"
                    value={type.value}
                    checked={formData.recipient_type === type.value}
                    onChange={handleInputChange}
                  />
                  <type.icon />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>

            {/* 특정 사용자 입력 */}
            {formData.recipient_type === 'specific' && (
              <div className="form-group">
                <label>사용자 ID (쉼표로 구분)</label>
                <input
                  type="text"
                  name="user_ids"
                  value={formData.user_ids}
                  onChange={handleInputChange}
                  placeholder="예: 1, 2, 3"
                  className="form-input"
                />
              </div>
            )}

            {/* 위치 기반 입력 */}
            {formData.recipient_type === 'location_based' && (
              <div className="location-inputs">
                <div className="form-group">
                  <label>위치명</label>
                  <input
                    type="text"
                    name="location_name"
                    value={formData.location_name}
                    onChange={handleInputChange}
                    placeholder="예: 서울시 강남구"
                    className="form-input"
                  />
                </div>
                <div className="coordinate-inputs">
                  <div className="form-group">
                    <label>위도</label>
                    <input
                      type="number"
                      step="any"
                      name="location_latitude"
                      value={formData.location_latitude}
                      onChange={handleInputChange}
                      placeholder="37.5665"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>경도</label>
                    <input
                      type="number"
                      step="any"
                      name="location_longitude"
                      value={formData.location_longitude}
                      onChange={handleInputChange}
                      placeholder="126.9780"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>반경 (km)</label>
                    <input
                      type="number"
                      name="radius_km"
                      value={formData.radius_km}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 알림 유형 */}
          <div className="form-section">
            <h3><FiBell /> 알림 유형</h3>
            <div className="alert-types">
              {alertTypes.map(type => (
                <label key={type.value} className={`alert-option ${formData.alert_type === type.value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="alert_type"
                    value={type.value}
                    checked={formData.alert_type === type.value}
                    onChange={handleInputChange}
                  />
                  <type.icon />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 위험 유형 */}
          <div className="form-section">
            <h3><FiAlertTriangle /> 알림 분류</h3>
            <div className="danger-types">
              {dangerTypes.map(type => (
                <label key={type.value} className={`danger-option ${formData.danger_type === type.value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="danger_type"
                    value={type.value}
                    checked={formData.danger_type === type.value}
                    onChange={handleInputChange}
                  />
                  <div className="danger-indicator" style={{ backgroundColor: type.color }}></div>
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 메시지 내용 */}
          <div className="form-section">
            <h3><FiInfo /> 메시지 내용</h3>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="알림 제목을 입력하세요"
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <label>내용</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="알림 메시지를 입력하세요"
                className="form-textarea"
                rows="6"
                required
              />
            </div>
          </div>

          {/* 발송 버튼 */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="send-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  발송 중...
                </>
              ) : (
                <>
                  <FiSend />
                  알림 발송
                </>
              )}
            </button>
          </div>
        </form>

        {/* 결과 표시 */}
        {result && (
          <div className={`result ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <div className="success-result">
                <FiCheckCircle />
                <h3>알림이 성공적으로 발송되었습니다!</h3>
                <div className="result-stats">
                  <div className="stat">
                    <span className="label">총 수신자:</span>
                    <span className="value">{result.data.total_recipients}명</span>
                  </div>
                  <div className="stat">
                    <span className="label">발송 성공:</span>
                    <span className="value success">{result.data.sent_count}명</span>
                  </div>
                  <div className="stat">
                    <span className="label">발송 실패:</span>
                    <span className="value error">{result.data.failed_count}명</span>
                  </div>
                </div>
                {result.data.recipients && result.data.recipients.length > 0 && (
                  <div className="recipients-list">
                    <h4>수신자 목록:</h4>
                    <div className="recipients">
                      {result.data.recipients.map(recipient => (
                        <div key={recipient.id} className="recipient">
                          {recipient.username} ({recipient.email})
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="error-result">
                <FiAlertTriangle />
                <h3>알림 발송에 실패했습니다</h3>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminNotification;

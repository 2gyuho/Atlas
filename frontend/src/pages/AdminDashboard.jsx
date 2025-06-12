import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Card from '../components/Card';
import AdminNotification from './AdminNotification';
import { 
  FiShield, FiUsers, FiActivity, FiBell, FiAlertTriangle, 
  FiUserCheck, FiMapPin, FiEdit3, FiTrash2, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiSearch, FiFilter,
  FiBarChart2, FiCheckCircle, FiXCircle, FiClock, FiSend
} from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('stats');
  
  // 통계 데이터
  const [stats, setStats] = useState(null);
  
  // 사용자 관리
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(0);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({ latitude: '', longitude: '' });
  
  // 알림 로그
  const [alertLogs, setAlertLogs] = useState([]);
  const [logFilters, setLogFilters] = useState({
    days: 7,
    alertType: '',
    dangerType: '',
    userId: ''
  });
  const [logPage, setLogPage] = useState(0);

  useEffect(() => {
    if (!user?.token) return;
    
    // 관리자 권한 확인
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'logs') {
      loadAlertLogs();
    }
  }, [activeTab, userPage, logPage, userSearch, logFilters]);

  const checkAdminAccess = async () => {
    try {
      const response = await apiService.get('/api/auth/me');
      if (!response.data.is_admin) {
        setError('관리자 권한이 필요합니다.');
        return;
      }
      setLoading(false);
    } catch (err) {
      setError('권한 확인 중 오류가 발생했습니다.');
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiService.get('/api/admin/stats');
      setStats(response.data);
    } catch (err) {
      setError('통계 정보를 불러오는데 실패했습니다.');
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        skip: userPage * 20,
        limit: 20
      });
      if (userSearch) params.append('search', userSearch);
      
      const response = await apiService.get(`/api/admin/users?${params}`);
      setUsers(response.data);
    } catch (err) {
      setError('사용자 목록을 불러오는데 실패했습니다.');
    }
  };

  const loadAlertLogs = async () => {
    try {
      const params = new URLSearchParams({
        skip: logPage * 20,
        limit: 20,
        days: logFilters.days
      });
      if (logFilters.alertType) params.append('alert_type', logFilters.alertType);
      if (logFilters.dangerType) params.append('danger_type', logFilters.dangerType);
      if (logFilters.userId) params.append('user_id', logFilters.userId);
      
      const response = await apiService.get(`/api/admin/alert-logs?${params}`);
      setAlertLogs(response.data);
    } catch (err) {
      setError('알림 로그를 불러오는데 실패했습니다.');
    }
  };

  const updateUserLocation = async (userId) => {
    try {
      await apiService.put(`/api/admin/users/${userId}/location`, {
        user_id: userId,
        latitude: parseFloat(locationForm.latitude),
        longitude: parseFloat(locationForm.longitude)
      });
      
      setEditingLocation(null);
      setLocationForm({ latitude: '', longitude: '' });
      loadUsers();
      alert('사용자 위치가 업데이트되었습니다.');
    } catch (err) {
      alert('위치 업데이트에 실패했습니다.');
    }
  };

  const toggleAdminStatus = async (userId) => {
    try {
      await apiService.put(`/api/admin/users/${userId}/admin`);
      loadUsers();
      alert('관리자 권한이 변경되었습니다.');
    } catch (err) {
      alert('권한 변경에 실패했습니다.');
    }
  };

  const deleteAlertLog = async (logId) => {
    if (!confirm('이 알림 로그를 삭제하시겠습니까?')) return;
    
    try {
      await apiService.delete(`/api/admin/alert-logs/${logId}`);
      loadAlertLogs();
      alert('알림 로그가 삭제되었습니다.');
    } catch (err) {
      alert('로그 삭제에 실패했습니다.');
    }
  };

  const clearOldLogs = async () => {
    const days = prompt('며칠 이전의 로그를 삭제하시겠습니까?', '30');
    if (!days || isNaN(days)) return;
    
    if (!confirm(`${days}일 이전의 모든 알림 로그를 삭제하시겠습니까?`)) return;
    
    try {
      await apiService.delete(`/api/admin/alert-logs?days=${days}`);
      loadAlertLogs();
      alert('오래된 알림 로그가 삭제되었습니다.');
    } catch (err) {
      alert('로그 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatLocation = (lat, lng) => {
    if (!lat || !lng) return '위치 없음';
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };
  if (loading) {
    return <div className="loading">관리자 권한을 확인하는 중...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // 알림 발송 화면 표시
  if (activeTab === 'notification') {
    return <AdminNotification onBack={() => setActiveTab('stats')} />;
  }

  return (
    <div className="admin-dashboard">
      <h1><FiShield /> 관리자 대시보드</h1>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <FiBarChart2 style={{ marginRight: '8px' }} />
          통계
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers style={{ marginRight: '8px' }} />
          사용자 관리
        </button>        <button 
          className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FiBell style={{ marginRight: '8px' }} />
          알림 로그
        </button>
        <button 
          className={`tab ${activeTab === 'notification' ? 'active' : ''}`}
          onClick={() => setActiveTab('notification')}
        >
          <FiSend style={{ marginRight: '8px' }} />
          알림 보내기
        </button>
      </div>{activeTab === 'stats' && stats && (
        <Card>
          <h2><FiBarChart2 style={{ marginRight: '8px' }} />시스템 통계</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">
                  <FiUsers />
                </div>
                <div className="stat-info">
                  <div className="stat-label">전체 사용자</div>
                  <div className="stat-value">{stats.total_users}</div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">
                  <FiActivity />
                </div>
                <div className="stat-info">
                  <div className="stat-label">활성 사용자</div>
                  <div className="stat-value">{stats.active_users}</div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">
                  <FiBell />
                </div>
                <div className="stat-info">
                  <div className="stat-label">알림 활성화</div>
                  <div className="stat-value">{stats.alert_enabled_users}</div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <div className="stat-label">오늘 알림</div>
                  <div className="stat-value">{stats.total_alerts_today}</div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">
                  <FiAlertTriangle />
                </div>
                <div className="stat-info">
                  <div className="stat-label">실패한 알림</div>
                  <div className="stat-value">{stats.failed_alerts_today}</div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-content">
                <div className="stat-icon">
                  <FiShield />
                </div>
                <div className="stat-info">
                  <div className="stat-label">관리자</div>
                  <div className="stat-value">{stats.admin_users}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}      {activeTab === 'users' && (
        <Card>
          <h2><FiUsers style={{ marginRight: '8px' }} />사용자 관리</h2>
          <div className="search-controls">
            <div style={{ position: 'relative', flex: 1 }}>
              <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                placeholder="이메일 또는 사용자명 검색"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="search-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <button className="btn btn-primary" onClick={loadUsers}>
              <FiRefreshCw style={{ marginRight: '4px' }} />
              검색
            </button>
          </div>          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>사용자 정보</th>
                  <th>위치</th>
                  <th>상태</th>
                  <th>권한</th>
                  <th>가입일</th>
                  <th>작업</th>
                </tr>
              </thead>              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td className="user-id">{user.id}</td>
                    <td className="user-info">
                      <div className="user-details">
                        <div className="user-name">{user.username}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                    </td>
                    <td className="user-location">
                      {editingLocation === user.id ? (
                        <div className="location-form">
                          <div className="location-inputs">
                            <input
                              type="number"
                              step="any"
                              placeholder="위도"
                              value={locationForm.latitude}
                              onChange={(e) => setLocationForm({
                                ...locationForm,
                                latitude: e.target.value
                              })}
                              className="location-input"
                            />
                            <input
                              type="number"
                              step="any"
                              placeholder="경도"
                              value={locationForm.longitude}
                              onChange={(e) => setLocationForm({
                                ...locationForm,
                                longitude: e.target.value
                              })}
                              className="location-input"
                            />
                          </div>
                          <div className="location-buttons">
                            <button 
                              className="btn btn-success btn-sm"
                              onClick={() => updateUserLocation(user.id)}
                            >
                              <FiCheckCircle />
                            </button>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => setEditingLocation(null)}
                            >
                              <FiXCircle />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="location-display">
                          <FiMapPin />
                          <span>{formatLocation(user.current_latitude, user.current_longitude)}</span>
                        </div>
                      )}
                    </td>                    <td className="user-status">
                      <div className="status-badges">
                        <span className={`status-badge ${user.alert_enabled ? 'status-active' : 'status-inactive'}`}>
                          <FiBell />
                          {user.alert_enabled ? '알림 ON' : '알림 OFF'}
                        </span>
                        <span className={`status-badge ${user.auto_location_tracking ? 'status-active' : 'status-inactive'}`}>
                          <FiActivity />
                          {user.auto_location_tracking ? '추적 ON' : '추적 OFF'}
                        </span>
                      </div>
                    </td>
                    <td className="user-admin">
                      {user.is_admin ? (
                        <span className="admin-badge">
                          <FiShield />
                          관리자
                        </span>
                      ) : (
                        <span className="user-badge">
                          일반 사용자
                        </span>
                      )}
                    </td>
                    <td className="user-date">{formatDate(user.created_at)}</td>                    <td className="user-actions">
                      <div className="action-buttons">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setEditingLocation(user.id);
                            setLocationForm({
                              latitude: user.current_latitude || '',
                              longitude: user.current_longitude || ''
                            });
                          }}
                          title="위치 변경"
                        >
                          <FiMapPin />
                        </button>
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => toggleAdminStatus(user.id)}
                          title="관리자 권한 변경"
                        >
                          <FiUserCheck />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div><div className="pagination">
            <button 
              onClick={() => setUserPage(Math.max(0, userPage - 1))}
              disabled={userPage === 0}
            >
              <FiChevronLeft style={{ marginRight: '4px' }} />
              이전
            </button>
            <span>페이지 {userPage + 1}</span>
            <button 
              onClick={() => setUserPage(userPage + 1)}
              disabled={users.length < 20}
            >
              다음
              <FiChevronRight style={{ marginLeft: '4px' }} />            </button>
          </div>
        </Card>
      )}{activeTab === 'logs' && (
        <Card>
          <h2><FiBell style={{ marginRight: '8px' }} />알림 로그</h2>
          <div className="search-controls">
            <select
              value={logFilters.days}
              onChange={(e) => setLogFilters({...logFilters, days: e.target.value})}
              className="search-select"
            >
              <option value="1">1일</option>
              <option value="7">7일</option>
              <option value="30">30일</option>
              <option value="90">90일</option>
            </select>
            <select
              value={logFilters.alertType}
              onChange={(e) => setLogFilters({...logFilters, alertType: e.target.value})}
              className="search-select"
            >
              <option value="">모든 알림 타입</option>
              <option value="email">이메일</option>
              <option value="notification">알림</option>
            </select>
            <select
              value={logFilters.dangerType}
              onChange={(e) => setLogFilters({...logFilters, dangerType: e.target.value})}
              className="search-select"
            >
              <option value="">모든 위험 타입</option>
              <option value="crime">범죄</option>
              <option value="natural_disaster">자연재해</option>
              <option value="public_safety">공공안전</option>
            </select>
            <input
              type="number"
              placeholder="사용자 ID"
              value={logFilters.userId}
              onChange={(e) => setLogFilters({...logFilters, userId: e.target.value})}
              className="search-input"
              style={{ maxWidth: '120px' }}
            />
            <button className="btn btn-danger" onClick={clearOldLogs}>
              <FiTrash2 style={{ marginRight: '4px' }} />
              오래된 로그 삭제
            </button>
          </div>

          <table className="logs-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>사용자</th>
                <th>알림타입</th>
                <th>위험타입</th>
                <th>위치</th>
                <th>거리(km)</th>
                <th>뉴스제목</th>
                <th>상태</th>
                <th>시간</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {alertLogs.map(log => (
                <tr key={log.id}>
                  <td>{log.id}</td>
                  <td>{log.user_username} ({log.user_email})</td>
                  <td>{log.alert_type}</td>
                  <td>{log.danger_type}</td>
                  <td>{log.danger_location || '위치없음'}</td>
                  <td>{log.distance_km ? log.distance_km.toFixed(1) : '-'}</td>
                  <td title={log.news_title}>
                    {log.news_title ? 
                      (log.news_title.length > 50 ? 
                        log.news_title.substring(0, 50) + '...' : 
                        log.news_title
                      ) : 
                      '-'
                    }
                  </td>                  <td>
                    <span className={`status-badge ${log.is_sent ? 'status-sent' : 'status-failed'}`}>
                      {log.is_sent ? (
                        <>
                          <FiCheckCircle style={{ marginRight: '4px' }} />
                          발송됨
                        </>
                      ) : (
                        <>
                          <FiXCircle style={{ marginRight: '4px' }} />
                          실패
                        </>
                      )}
                    </span>
                    {log.error_message && (
                      <div title={log.error_message} style={{fontSize: '12px', color: 'var(--error)', marginTop: '4px'}}>
                        <FiAlertTriangle style={{ marginRight: '4px' }} />
                        오류: {log.error_message.substring(0, 30)}...
                      </div>
                    )}
                  </td>
                  <td>{formatDate(log.created_at)}</td>
                  <td>
                    <button 
                      className="btn btn-danger"
                      onClick={() => deleteAlertLog(log.id)}
                    >
                      <FiTrash2 style={{ marginRight: '4px' }} />
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button 
              onClick={() => setLogPage(Math.max(0, logPage - 1))}
              disabled={logPage === 0}
            >
              이전
            </button>
            <span>페이지 {logPage + 1}</span>
            <button 
              onClick={() => setLogPage(logPage + 1)}
              disabled={alertLogs.length < 20}
            >
              다음
            </button>
          </div>        </Card>
      )}
    </div>
  );
};

export default AdminDashboard;

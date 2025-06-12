import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import locationTracker from '../services/locationTracker';
import reverseGeocodingService from '../services/reverseGeocoding';
import './AlertSettings.css';

const AlertSettings = () => {
    const { user, locationStatus, startLocationTracking, stopLocationTracking } = useAuth();
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        alert_enabled: false,
        alert_radius_km: 50,
        current_location: null
    });    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [nearbyDangers, setNearbyDangers] = useState([]);    const [checking, setChecking] = useState(false);
    const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);    const [locationUpdateStatus, setLocationUpdateStatus] = useState('');
    const [debugInfo, setDebugInfo] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);    const addDebugInfo = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugInfo(prev => [{
            id: Date.now(),
            timestamp,
            message,
            type
        }, ...prev].slice(0, 20));
        console.log(`[${type.toUpperCase()}] ${message}`);
    };

    // 위치에서 주소 가져오기
    const getAddressFromLocation = async (latitude, longitude) => {
        if (!latitude || !longitude) return;
        
        setAddressLoading(true);
        addDebugInfo(`주소 변환 시작: ${latitude}, ${longitude}`, 'info');
        
        try {
            const address = await reverseGeocodingService.getAddressFromCoordinates(latitude, longitude);
            setCurrentAddress(address);
            addDebugInfo(`주소 변환 성공: ${address}`, 'success');
        } catch (error) {
            console.error('주소 변환 실패:', error);
            addDebugInfo(`주소 변환 실패: ${error.message}`, 'error');
            setCurrentAddress('주소를 가져올 수 없습니다');
        } finally {
            setAddressLoading(false);
        }
    };useEffect(() => {
        addDebugInfo('컴포넌트 마운트됨', 'info');
        
        if (!user) {
            // 사용자가 로그인하지 않은 경우
            addDebugInfo('사용자 정보 없음 - 로그인 필요', 'error');
            setLoadError('로그인이 필요합니다.');
            setLoading(false);
            return;
        }
        
        addDebugInfo(`사용자 확인됨: ${user.email}`, 'success');
        
        if (user?.token) {
            addDebugInfo('토큰 존재 - 설정 로딩 시작', 'info');
            loadSettings();
        } else {
            addDebugInfo('토큰 없음', 'error');
            setLoadError('인증 토큰이 없습니다. 다시 로그인해주세요.');
            setLoading(false);
        }
        
        // 자동 위치 추적 상태 확인
        setAutoLocationEnabled(locationStatus.isTracking);
        addDebugInfo(`자동 위치 추적 상태: ${locationStatus.isTracking ? '활성' : '비활성'}`, 'info');
    }, [user, locationStatus]);const loadSettings = async () => {
        try {
            setLoadError(null);
            addDebugInfo('설정 로딩 시작', 'info');
            addDebugInfo(`사용자 정보: ${user?.email || 'no email'}, 토큰: ${user?.token ? 'exists' : 'missing'}`, 'info');
            
            const response = await apiService.get('/api/alerts/settings');
            addDebugInfo(`API 응답 성공: status ${response.status}`, 'success');
              if (response.data) {
                const newSettings = {
                    alert_enabled: response.data.alert_enabled || false,
                    alert_radius_km: response.data.alert_radius_km || 50,
                    current_location: response.data.current_location || null
                };
                setSettings(newSettings);
                
                // 위치가 있으면 주소도 가져오기
                if (newSettings.current_location) {
                    getAddressFromLocation(
                        newSettings.current_location.latitude,
                        newSettings.current_location.longitude
                    );
                }
                
                addDebugInfo('설정 로딩 완료', 'success');
            }
        } catch (error) {
            const errorMsg = `설정 로드 실패: ${error.message}`;
            addDebugInfo(errorMsg, 'error');
            addDebugInfo(`상태 코드: ${error.response?.status}, 데이터: ${JSON.stringify(error.response?.data)}`, 'error');
            
            let errorMessage = '설정을 불러오는데 실패했습니다.';
            
            if (error.response?.status === 401) {
                errorMessage = '로그인이 필요합니다.';
            } else if (error.response?.status === 500) {
                errorMessage = '서버 오류가 발생했습니다.';
            } else if (error.message.includes('Network Error')) {
                errorMessage = '네트워크 연결을 확인해주세요.';
            } else {
                errorMessage = `오류: ${error.message}`;
            }
            
            setLoadError(errorMessage);
        } finally {
            addDebugInfo('로딩 완료', 'info');
            setLoading(false);
        }
    };    // 자동 위치 추적 토글
    const toggleAutoLocation = async () => {
        try {
            addDebugInfo(`자동 위치 추적 토글 시도: ${autoLocationEnabled ? '중지' : '시작'}`, 'info');
            
            if (autoLocationEnabled) {
                stopLocationTracking();
                setAutoLocationEnabled(false);
                addDebugInfo('자동 위치 추적 중지됨', 'info');
            } else {
                await startLocationTracking();
                setAutoLocationEnabled(true);
                addDebugInfo('자동 위치 추적 시작됨', 'success');
            }
        } catch (error) {
            console.error('자동 위치 추적 토글 실패:', error);
            addDebugInfo(`자동 위치 추적 토글 실패: ${error.message}`, 'error');
            alert('자동 위치 추적 설정에 실패했습니다: ' + error.message);
        }
    };

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationUpdateStatus('위치 서비스가 지원되지 않습니다.');
            return;
        }

        setLocationUpdateStatus('위치 정보를 가져오는 중...');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    console.log('Updating location:', { latitude, longitude });
                    const response = await apiService.put('/api/alerts/location', { latitude, longitude });
                    console.log('Location update response:', response.data);
                      setLocationUpdateStatus('위치가 업데이트되었습니다.');
                    setSettings(prev => ({
                        ...prev,
                        current_location: { latitude, longitude }
                    }));
                    
                    // 새로운 위치의 주소 가져오기
                    getAddressFromLocation(latitude, longitude);
                } catch (error) {
                    console.error('서버 위치 업데이트 실패:', error);
                    if (error.response?.status === 401) {
                        setLocationUpdateStatus('로그인이 필요합니다.');
                    } else {
                        setLocationUpdateStatus('위치 업데이트에 실패했습니다: ' + (error.response?.data?.detail || error.message));
                    }
                }
            },
            (error) => {
                setLocationUpdateStatus('위치 정보를 가져올 수 없습니다: ' + error.message);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const updateSettings = async () => {
        setUpdating(true);
        try {
            console.log('Updating settings:', settings);
            const response = await apiService.put('/api/alerts/settings', {
                alert_enabled: settings.alert_enabled,
                alert_radius_km: settings.alert_radius_km
            });
            console.log('Settings update response:', response.data);
            alert('설정이 저장되었습니다.');
        } catch (error) {
            console.error('설정 저장 실패:', error);
            if (error.response?.status === 401) {
                alert('로그인이 필요합니다.');
            } else {
                alert('설정 저장에 실패했습니다: ' + (error.response?.data?.detail || error.message));
            }
        } finally {
            setUpdating(false);
        }
    };    const checkCurrentDangers = async () => {
        setChecking(true);
        try {
            console.log('Checking nearby dangers...');
            const response = await apiService.get('/api/alerts/nearby-dangers');
            console.log('Nearby dangers response:', response.data);
            setNearbyDangers(response.data.dangerous_news);
        } catch (error) {
            console.error('위험 상황 확인 실패:', error);
            if (error.response?.status === 401) {
                alert('로그인이 필요합니다.');
            } else if (error.response?.status === 400) {
                alert(error.response.data.detail || '위험 상황 확인에 실패했습니다.');
            } else {
                alert('위험 상황 확인 중 오류가 발생했습니다: ' + (error.response?.data?.detail || error.message));
            }
        } finally {
            setChecking(false);
        }
    };

    const sendTestEmail = async () => {
        try {
            console.log('Sending test email...');
            const response = await apiService.post('/api/alerts/test-email');
            console.log('Test email response:', response.data);
            alert('테스트 이메일이 발송되었습니다.');
        } catch (error) {
            console.error('테스트 이메일 발송 실패:', error);
            if (error.response?.status === 401) {
                alert('로그인이 필요합니다.');
            } else {
                alert('테스트 이메일 발송에 실패했습니다: ' + (error.response?.data?.detail || error.message));
            }
        }
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'high': return '#dc3545';
            case 'medium': return '#fd7e14';
            case 'low': return '#ffc107';
            default: return '#6c757d';
        }
    };

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'high': return '🔴';
            case 'medium': return '🟠';
            case 'low': return '🟡';
            default: return '⚠️';
        }
    };    if (loading) {
        return (
            <div className="alert-settings loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>설정을 불러오는 중...</p>
                    <small>잠시만 기다려주세요</small>
                </div>
            </div>
        );
    }    if (loadError) {
        return (
            <div className="alert-settings loading">
                <div className="error-message">
                    <div className="error-icon">❌</div>
                    <h3>설정 로드 실패</h3>
                    <p>{loadError}</p>
                    {loadError.includes('로그인') ? (
                        <button 
                            className="retry-button"
                            onClick={() => navigate('/login')}
                        >
                            🔑 로그인하기
                        </button>
                    ) : (
                        <button 
                            className="retry-button"
                            onClick={() => {
                                setLoading(true);
                                setLoadError(null);
                                loadSettings();
                            }}
                        >
                            🔄 다시 시도
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="alert-settings">
            <h1>🚨 위험 알림 설정</h1>
            
            <div className="settings-section">
                <h2>📍 위치 설정</h2>
                
                {/* 자동 위치 추적 */}
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={autoLocationEnabled}
                            onChange={toggleAutoLocation}
                        />
                        🔄 자동 위치 추적 (권장)
                    </label>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                        자동으로 현재 위치를 추적하여 실시간 위험 알림을 받습니다.
                    </p>
                </div>

                {/* 위치 추적 상태 */}
                {locationStatus.isTracking && (
                    <div className="location-status">
                        <p>🟢 자동 위치 추적 중</p>
                        {locationStatus.lastPosition && (
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                마지막 업데이트: {new Date(locationStatus.lastPosition.timestamp).toLocaleString()}
                            </p>
                        )}
                    </div>
                )}                {locationStatus.error && (
                    <div className="error-message" style={{ color: '#dc3545', marginTop: '10px' }}>
                        ⚠️ {locationStatus.error}
                        {locationStatus.error.includes('권한') && (
                            <div style={{ marginTop: '10px' }}>
                                <button 
                                    onClick={async () => {
                                        try {
                                            addDebugInfo('위치 권한 재요청 시도', 'info');
                                            await startLocationTracking();
                                        } catch (error) {
                                            addDebugInfo(`권한 재요청 실패: ${error.message}`, 'error');
                                        }
                                    }}
                                    className="btn-secondary"
                                    style={{ fontSize: '12px' }}
                                >
                                    권한 다시 요청
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* 위치 권한 상태 표시 */}
                <div className="location-permission-status" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <small>
                        위치 권한: <strong>{
                            locationStatus.permission === 'granted' ? '✅ 허용됨' :
                            locationStatus.permission === 'denied' ? '❌ 거부됨' :
                            locationStatus.permission === 'prompt' ? '⏳ 미결정' :
                            '❓ 알 수 없음'
                        }</strong>
                        {locationStatus.permission === 'denied' && (
                            <div style={{ marginTop: '5px', color: '#dc3545' }}>
                                브라우저 설정에서 위치 권한을 허용해주세요.
                            </div>
                        )}
                    </small>
                </div>

                {locationUpdateStatus && (
                    <div className="location-update-status" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                        {locationUpdateStatus}
                    </div>
                )}                <div className="location-info">
                    <h3>현재 저장된 위치</h3>
                    {settings.current_location ? (
                        <div className="location-details">                            <div className="coordinates">
                                <strong style={{ color: '#495057' }}>📍 좌표:</strong>
                                <br />
                                <span style={{ color: '#333', fontWeight: '500' }}>
                                    위도: {settings.current_location.latitude.toFixed(6)}
                                </span>
                                <br />
                                <span style={{ color: '#333', fontWeight: '500' }}>
                                    경도: {settings.current_location.longitude.toFixed(6)}
                                </span>
                            </div>                              <div className="address" style={{ marginTop: '10px' }}>
                                <strong style={{ color: '#495057' }}>🏠 주소:</strong>
                                <br />
                                {addressLoading ? (
                                    <span style={{ color: '#666', fontStyle: 'italic' }}>
                                        <span className="loading-dots">주소를 가져오는 중</span>
                                    </span>
                                ) : currentAddress ? (
                                    <span style={{ color: '#333', fontWeight: '400' }}>
                                        {currentAddress}
                                    </span>
                                ) : (
                                    <span style={{ color: '#999', fontStyle: 'italic' }}>
                                        주소 정보 없음
                                    </span>
                                )}
                                {!addressLoading && settings.current_location && (
                                    <button
                                        onClick={() => getAddressFromLocation(
                                            settings.current_location.latitude,
                                            settings.current_location.longitude
                                        )}
                                        className="btn-secondary"
                                        style={{ 
                                            fontSize: '11px', 
                                            padding: '3px 8px', 
                                            marginLeft: '10px' 
                                        }}
                                        disabled={addressLoading}
                                    >
                                        🔄 주소 새로고침
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>위치 정보가 없습니다.</p>
                    )}
                      {/* 수동 위치 업데이트 (자동 추적이 비활성화된 경우에만) */}
                    {!autoLocationEnabled && (
                        <button onClick={requestLocation} className="btn-secondary">
                            수동으로 위치 업데이트
                        </button>
                    )}
                    
                    {/* 위치 추적 테스트 버튼 */}
                    <div style={{ marginTop: '10px' }}>                        <button 
                            onClick={async () => {
                                try {
                                    addDebugInfo('위치 추적 즉시 테스트 시작', 'info');
                                    const location = await locationTracker.getCurrentPosition();
                                    addDebugInfo(`현재 위치: ${location.latitude}, ${location.longitude}`, 'success');
                                    
                                    // 주소 가져오기
                                    const address = await reverseGeocodingService.getAddressFromCoordinates(
                                        location.latitude, 
                                        location.longitude
                                    );
                                    addDebugInfo(`현재 주소: ${address}`, 'success');
                                    
                                    // 서버로 위치 전송
                                    await locationTracker.sendLocationToServer(location);
                                    addDebugInfo('서버로 위치 전송 완료', 'success');
                                    
                                    // 설정 업데이트
                                    setSettings(prev => ({
                                        ...prev,
                                        current_location: { 
                                            latitude: location.latitude, 
                                            longitude: location.longitude 
                                        }
                                    }));
                                    setCurrentAddress(address);
                                    
                                    alert(`위치 테스트 성공!\n위치: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}\n주소: ${address}`);
                                } catch (error) {
                                    addDebugInfo(`위치 테스트 실패: ${error.message}`, 'error');
                                    alert('위치 테스트 실패: ' + error.message);
                                }
                            }}
                            className="btn-secondary"
                            style={{ fontSize: '12px' }}
                        >
                            🧪 위치 추적 테스트
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-section">
                <h2>⚙️ 알림 설정</h2>
                <div className="setting-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.alert_enabled}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                alert_enabled: e.target.checked
                            }))}
                        />
                        위험 알림 활성화
                    </label>
                </div>
                
                <div className="setting-item">
                    <label>
                        알림 반경 (km):
                        <input
                            type="number"
                            min="1"
                            max="200"
                            value={settings.alert_radius_km}
                            onChange={(e) => setSettings(prev => ({
                                ...prev,
                                alert_radius_km: parseInt(e.target.value)
                            }))}
                        />
                    </label>
                </div>

                <button 
                    onClick={updateSettings} 
                    disabled={updating}
                    className="btn-primary"
                >
                    {updating ? '저장 중...' : '설정 저장'}
                </button>
            </div>

            <div className="settings-section">
                <h2>🔍 현재 위험 상황 확인</h2>
                <div className="danger-check">
                    <button 
                        onClick={checkCurrentDangers} 
                        disabled={checking || !settings.current_location}
                        className="btn-secondary"
                    >
                        {checking ? '확인 중...' : '주변 위험 상황 확인'}
                    </button>
                    
                    <button 
                        onClick={sendTestEmail}
                        className="btn-secondary"
                    >
                        테스트 이메일 발송
                    </button>
                </div>

                {nearbyDangers.length > 0 && (
                    <div className="danger-list">
                        <h3>⚠️ 주변 위험 상황 ({nearbyDangers.length}건)</h3>
                        {nearbyDangers.map((news, index) => (
                            <div key={index} className="danger-item">
                                <div className="danger-header">
                                    <span className="severity-icon">
                                        {getSeverityIcon(news.danger_info?.severity)}
                                    </span>
                                    <h4>{news.title}</h4>
                                    <span 
                                        className="severity-badge"
                                        style={{ 
                                            backgroundColor: getSeverityColor(news.danger_info?.severity),
                                            color: 'white'
                                        }}
                                    >
                                        {news.danger_info?.severity?.toUpperCase()}
                                    </span>
                                </div>
                                <p className="news-meta">
                                    출처: {news.source} | 날짜: {news.published || news.date}
                                </p>
                                <div className="danger-keywords">
                                    <strong>감지된 키워드:</strong>{' '}
                                    {news.danger_info?.matched_keywords?.slice(0, 5).map((keyword, i) => (
                                        <span key={i} className="keyword-tag">{keyword}</span>
                                    ))}
                                </div>
                                {news.url && (
                                    <a href={news.url} target="_blank" rel="noopener noreferrer">
                                        뉴스 전문 보기
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}                {nearbyDangers.length === 0 && checking === false && settings.current_location && (
                    <p className="no-dangers">🟢 현재 주변에 위험 상황이 감지되지 않았습니다.</p>
                )}
            </div>

            {/* 디버그 패널 */}
            <div className="settings-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2>🔧 디버그 정보</h2>
                    <button 
                        onClick={() => setShowDebug(!showDebug)}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                        {showDebug ? '숨기기' : '보기'}
                    </button>
                    <button 
                        onClick={() => setDebugInfo([])}
                        className="btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                    >
                        지우기
                    </button>
                </div>

                {showDebug && (
                    <div className="debug-panel" style={{
                        background: '#f8f9fa',
                        border: '1px solid #e9ecef',
                        borderRadius: '4px',
                        padding: '15px',
                        marginTop: '10px',
                        maxHeight: '300px',
                        overflowY: 'auto',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                    }}>                        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
                            사용자 정보: {user?.email || 'Not logged in'} | 
                            토큰: {user?.token ? 'Present' : 'Missing'} |
                            localStorage 토큰: {localStorage.getItem('token') ? 'Present' : 'Missing'} |
                            로딩: {loading ? 'Yes' : 'No'} |
                            에러: {loadError ? 'Yes' : 'No'}
                        </div>
                        
                        {debugInfo.length === 0 ? (
                            <p>디버그 정보가 없습니다.</p>
                        ) : (
                            debugInfo.map(log => (
                                <div key={log.id} style={{
                                    padding: '5px',
                                    marginBottom: '3px',
                                    borderLeft: `3px solid ${
                                        log.type === 'error' ? '#dc3545' : 
                                        log.type === 'success' ? '#28a745' : '#007bff'
                                    }`,
                                    paddingLeft: '10px',
                                    backgroundColor: log.type === 'error' ? '#fff5f5' : 'white'
                                }}>
                                    <span style={{ color: '#666' }}>{log.timestamp}</span> - 
                                    <span style={{ 
                                        color: log.type === 'error' ? '#dc3545' : 
                                               log.type === 'success' ? '#28a745' : '#007bff',
                                        fontWeight: 'bold'
                                    }}>[{log.type.toUpperCase()}]</span> {log.message}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AlertSettings;

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
        auto_location_tracking: false,
        location_update_frequency: 300,
        current_location: null
    });
    
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [nearbyDangers, setNearbyDangers] = useState([]);
    const [checking, setChecking] = useState(false);
    const [autoLocationEnabled, setAutoLocationEnabled] = useState(false);
    const [locationUpdateStatus, setLocationUpdateStatus] = useState('');
    const [debugInfo, setDebugInfo] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);

    const addDebugInfo = (message, type = 'info') => {
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
    };

    const loadSettings = async () => {
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
                    auto_location_tracking: response.data.auto_location_tracking || false,
                    location_update_frequency: response.data.location_update_frequency || 300,
                    current_location: response.data.current_location || null
                };
                setSettings(newSettings);
                
                // 데이터베이스의 자동 위치 추적 설정과 UI 동기화
                setAutoLocationEnabled(newSettings.auto_location_tracking);
                addDebugInfo(`DB에서 자동 위치 추적 설정 로드: ${newSettings.auto_location_tracking}`, 'info');
                
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
    };

    // 자동 위치 추적 토글
    const toggleAutoLocation = async () => {
        try {
            const newValue = !autoLocationEnabled;
            addDebugInfo(`자동 위치 추적 토글 시도: ${newValue ? '시작' : '중지'}`, 'info');
            
            // 먼저 UI 상태 업데이트
            setAutoLocationEnabled(newValue);
            
            // 데이터베이스에 설정 저장
            try {
                const response = await apiService.put('/api/alerts/auto-location', {
                    auto_location_tracking: newValue,
                    location_update_frequency: settings.location_update_frequency || 300
                });
                
                addDebugInfo(`DB 저장 성공: ${JSON.stringify(response.data)}`, 'success');
                
                // settings 상태도 업데이트
                setSettings(prev => ({
                    ...prev,
                    auto_location_tracking: newValue
                }));
                
            } catch (dbError) {
                addDebugInfo(`DB 저장 실패: ${dbError.message}`, 'error');
                // DB 저장 실패 시 UI 상태 롤백
                setAutoLocationEnabled(!newValue);
                throw new Error(`설정 저장 실패: ${dbError.message}`);
            }
            
            // 위치 추적 서비스 시작/중지
            if (newValue) {
                await startLocationTracking();
                addDebugInfo('자동 위치 추적 시작됨', 'success');
            } else {
                stopLocationTracking();
                addDebugInfo('자동 위치 추적 중지됨', 'info');
            }
            
        } catch (error) {
            console.error('자동 위치 추적 토글 실패:', error);
            addDebugInfo(`자동 위치 추적 토글 실패: ${error.message}`, 'error');
            alert('자동 위치 추적 설정에 실패했습니다: ' + error.message);
        }
    };

    // 데이터베이스 설정에 따라 자동 위치 추적 시작
    const initializeLocationTracking = async () => {
        if (settings.auto_location_tracking && !locationStatus.isTracking) {
            try {
                addDebugInfo('DB 설정에 따라 자동 위치 추적 시작', 'info');
                await startLocationTracking();
            } catch (error) {
                addDebugInfo(`자동 시작 실패: ${error.message}`, 'error');
            }
        }
    };

    useEffect(() => {
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
    }, [user]);

    useEffect(() => {
        // 자동 위치 추적 토글 상태에 따라 초기 위치 추적 설정
        if (autoLocationEnabled) {
            startLocationTracking();
        } else {
            stopLocationTracking();
        }
    }, [autoLocationEnabled]);

    // locationStatus 변경 시 로그만 출력 (DB 설정이 우선)
    useEffect(() => {
        addDebugInfo(`위치 서비스 상태: ${locationStatus.isTracking ? '활성' : '비활성'}`, 'info');
    }, [locationStatus]);

    // settings가 로드된 후 자동 위치 추적 초기화
    useEffect(() => {
        if (settings.auto_location_tracking !== undefined && !loading) {
            initializeLocationTracking();
        }
    }, [settings.auto_location_tracking, loading]);    if (loading) {
        return (
            <div className="alert-settings loading">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>설정을 불러오는 중...</p>
                    <small>잠시만 기다려주세요</small>
                </div>
            </div>
        );
    }

    if (loadError) {
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
                )}

                {locationStatus.error && (
                    <div className="error-message" style={{ color: '#dc3545', marginTop: '10px' }}>
                        ⚠️ {locationStatus.error}
                    </div>
                )}

                {/* 현재 저장된 위치 */}
                <div className="location-info">
                    <h3>현재 저장된 위치</h3>
                    {settings.current_location ? (
                        <div className="location-details">
                            <div className="coordinates">
                                <strong>📍 좌표:</strong>
                                <br />
                                <span>위도: {settings.current_location.latitude.toFixed(6)}</span>
                                <br />
                                <span>경도: {settings.current_location.longitude.toFixed(6)}</span>
                            </div>
                            <div className="address" style={{ marginTop: '10px' }}>
                                <strong>🏠 주소:</strong>
                                <br />
                                {addressLoading ? (
                                    <span style={{ color: '#666', fontStyle: 'italic' }}>
                                        주소를 가져오는 중...
                                    </span>
                                ) : currentAddress ? (
                                    <span>{currentAddress}</span>
                                ) : (
                                    <span style={{ color: '#999', fontStyle: 'italic' }}>
                                        주소 정보 없음
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p>위치 정보가 없습니다.</p>
                    )}
                </div>
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
                    }}>
                        <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
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

import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';
import locationTracker from '../services/locationTracker';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState({
    isTracking: false,
    lastPosition: null,
    permission: 'unknown',
    error: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 토큰이 있으면 사용자 정보 확인
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {        // 사용자 정보를 API에서 가져오기
        try {
          const response = await apiService.get('/api/auth/me');
          setUser({ 
            token, 
            email: response.data.email,
            username: response.data.username,
            isAdmin: response.data.is_admin
          });
        } catch (error) {
          // API가 없으면 기본 사용자 정보 설정
          setUser({ token });
        }
        
        // 로그인된 사용자의 경우 자동 위치 추적 시작
        await startLocationTracking();
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  // 자동 위치 추적 시작
  const startLocationTracking = async () => {
    try {
      const permission = await locationTracker.checkPermission();
      setLocationStatus(prev => ({ ...prev, permission }));

      if (permission === 'granted' || permission === 'prompt') {
        await locationTracker.startTracking(
          (position) => {
            setLocationStatus(prev => ({
              ...prev,
              isTracking: true,
              lastPosition: position,
              error: null
            }));
          },
          (error) => {
            setLocationStatus(prev => ({
              ...prev,
              isTracking: false,
              error: error.message
            }));
          }
        );
      }
    } catch (error) {
      console.warn('자동 위치 추적 시작 실패:', error);
      setLocationStatus(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  // 위치 추적 중지
  const stopLocationTracking = () => {
    locationTracker.stopTracking();
    setLocationStatus({
      isTracking: false,
      lastPosition: null,
      permission: 'unknown',
      error: null
    });
  };  const login = async (email, password) => {
    try {
      const response = await apiService.post('/api/auth/login', { email, password });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // 사용자 정보를 API에서 가져오기
      try {
        const userResponse = await apiService.get('/api/auth/me');
        setUser({ 
          token: access_token, 
          email: userResponse.data.email,
          username: userResponse.data.username,
          isAdmin: userResponse.data.is_admin
        });
      } catch (error) {
        // 사용자 정보를 가져올 수 없으면 기본 정보만 설정
        setUser({ token: access_token, email });
      }
      
      // 로그인 성공 후 자동 위치 추적 시작
      await startLocationTracking();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || '로그인에 실패했습니다.' 
      };
    }
  };

  const register = async (email, username, password) => {
    try {
      await apiService.post('/api/auth/register', { email, username, password });
      // 회원가입 후 자동 로그인
      return await login(email, password);
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || '회원가입에 실패했습니다.' 
      };
    }
  };
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // 로그아웃 시 위치 추적 중지
    stopLocationTracking();
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    locationStatus,
    startLocationTracking,
    stopLocationTracking
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
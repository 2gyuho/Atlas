import React, { createContext, useState, useContext, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 토큰이 있으면 사용자 정보 확인
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      // 토큰 검증 API 호출 (현재는 간단히 토큰 존재 여부만 확인)
      const token = localStorage.getItem('token');
      if (token) {
        setUser({ token });
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };  const login = async (email, password) => {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser({ token: access_token, email });
      
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
      await apiService.post('/auth/register', { email, username, password });
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
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
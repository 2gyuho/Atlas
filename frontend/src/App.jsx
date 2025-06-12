import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ApiTest from './pages/ApiTest';
import Login from './pages/Login';
import Register from './pages/Register';
import Embassies from './pages/Embassies';
import MyPage from './pages/MyPage';
import AlertSettings from './pages/AlertSettings';
import AdminDashboard from './pages/AdminDashboard';
import NotificationDebug from './pages/NotificationDebug';
import NotificationTestPage from './pages/NotificationTestPage';
import './styles/globals.css';

// 보호된 라우트 컴포넌트
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// 관리자 전용 라우트 컴포넌트
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!user.isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* 대사관 페이지는 로그인 없이도 접근 가능 */}
            <Route path="/embassies" element={<Embassies />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />            <Route 
              path="/api-test" 
              element={
                <ProtectedRoute>
                  <ApiTest />
                </ProtectedRoute>
              } 
            />            <Route
              path="/mypage" 
              element={
                <ProtectedRoute>
                  <MyPage />
                </ProtectedRoute>
              } 
            />            <Route
              path="/alert-settings" 
              element={
                <ProtectedRoute>
                  <AlertSettings />
                </ProtectedRoute>
              } 
            />            <Route
              path="/notification-debug" 
              element={
                <ProtectedRoute>
                  <NotificationDebug />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/notification-test" 
              element={
                <ProtectedRoute>
                  <NotificationTestPage />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
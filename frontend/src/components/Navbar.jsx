import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiGrid, FiCode, FiMenu, FiX, FiMapPin, FiLogOut, FiLogIn, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { path: '/', label: '홈', icon: <FiHome /> },
    { path: '/embassies', label: '대사관', icon: <FiMapPin /> }, // protected 속성 제거
    { path: '/mypage', label: '마이페이지', icon: <FiUser />, protected: true },
    { path: '/dashboard', label: '대시보드', icon: <FiGrid />, protected: true },
    { path: '/api-test', label: 'API 테스트', icon: <FiCode />, protected: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const filteredNavItems = navItems.filter(item => !item.protected || user);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="gradient-text">Atlas</span>
        </Link>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="navbar-icon">{item.icon}</span>
              <span>{item.label}</span>
              {location.pathname === item.path && (
                <motion.div
                  className="navbar-indicator"
                  layoutId="navbar-indicator"
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          ))}
          
          {user ? (
            <button
              onClick={handleLogout}
              className="navbar-link navbar-logout"
            >
              <span className="navbar-icon"><FiLogOut /></span>
              <span>로그아웃</span>
            </button>
          ) : (
            <Link
              to="/login"
              className={`navbar-link ${location.pathname === '/login' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="navbar-icon"><FiLogIn /></span>
              <span>로그인</span>
            </Link>
          )}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiGrid, FiCode, FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: '홈', icon: <FiHome /> },
    { path: '/dashboard', label: '대시보드', icon: <FiGrid /> },
    { path: '/api-test', label: 'API 테스트', icon: <FiCode /> },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="gradient-text">FastAPI</span>
        </Link>

        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
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
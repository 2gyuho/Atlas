import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiActivity, FiTrendingUp, FiServer } from 'react-icons/fi';
import Card from '../components/Card';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState([
    { icon: <FiUsers />, label: '총 사용자', value: '1,234', trend: '+12%' },
    { icon: <FiActivity />, label: 'API 호출', value: '45.2K', trend: '+23%' },
    { icon: <FiTrendingUp />, label: '성공률', value: '99.8%', trend: '+0.3%' },
    { icon: <FiServer />, label: '응답 시간', value: '45ms', trend: '-5ms' }
  ]);

  const [activities, setActivities] = useState([
    { id: 1, type: 'API', message: 'GET /api/users 호출 성공', time: '방금 전' },
    { id: 2, type: 'System', message: '서버 상태 정상', time: '5분 전' },
    { id: 3, type: 'API', message: 'POST /api/data 새 데이터 생성', time: '10분 전' },
    { id: 4, type: 'User', message: '새 사용자 등록', time: '15분 전' }
  ]);

  return (
    <div className="dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="dashboard-title">대시보드</h1>
        
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card gradient>
                <div className="stat-content">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-info">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{stat.value}</h3>
                    <span className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                      {stat.trend}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="dashboard-grid">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="activity-section"
          >
            <Card title="최근 활동" subtitle="실시간 시스템 로그">
              <div className="activity-list">
                {activities.map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className="activity-type">{activity.type}</div>
                    <div className="activity-details">
                      <p className="activity-message">{activity.message}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="chart-section"
          >
            <Card title="API 사용량" subtitle="최근 7일">
              <div className="chart-placeholder">
                <div className="chart-bar" style={{ height: '60%' }}></div>
                <div className="chart-bar" style={{ height: '80%' }}></div>
                <div className="chart-bar" style={{ height: '70%' }}></div>
                <div className="chart-bar" style={{ height: '90%' }}></div>
                <div className="chart-bar" style={{ height: '85%' }}></div>
                <div className="chart-bar" style={{ height: '95%' }}></div>
                <div className="chart-bar" style={{ height: '100%' }}></div>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
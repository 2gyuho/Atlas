import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiZap, FiShield, FiCpu, FiPhone, FiBell, FiUser } from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiBell />,
      title: '알림 서비스',
      description: '어디선가 누군가에 무슨 일이 생기면'
    },
    {
      icon: <FiPhone />,
      title: '전화번호가 뭐지',
      description: '여권을 잃어버렸어요!'
    },
    {
      icon: <FiUser />,
      title: '커뮤니티',
      description: '이럴 때 어떻게 해야 할까요?'
    }
  ];

  return (
    <div className="home">
      <motion.section 
        className="hero"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="hero-title">
          <span className="gradient-text">아틀라스</span>와 함께하는
          <br />
          세계 여행
        </h1>
        <p className="hero-subtitle">
          여기다가 뭘 적어야 할지 모르겠어요.
        </p>
        <div className="hero-actions">
          <Button 
            onClick={() => navigate('/dashboard')}
            size="lg"
            icon={<FiArrowRight />}
          >
            시작하기
          </Button>
          <Button 
            onClick={() => navigate('/api-test')}
            variant="secondary"
            size="lg"
          >
            API 테스트
          </Button>
        </div>
      </motion.section>

      <motion.section 
        className="features"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            >
              <Card glass hover>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
};

export default Home;
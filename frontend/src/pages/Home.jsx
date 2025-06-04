import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiZap, FiShield, FiCpu } from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FiZap />,
      title: '초고속 성능',
      description: 'FastAPI의 비동기 처리로 빠른 응답 속도를 제공합니다.'
    },
    {
      icon: <FiShield />,
      title: '안전한 API',
      description: '자동 검증과 보안 기능으로 안전한 API를 구축합니다.'
    },
    {
      icon: <FiCpu />,
      title: '최신 기술',
      description: 'React와 FastAPI로 구축된 모던한 풀스택 애플리케이션입니다.'
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
          <span className="gradient-text">FastAPI</span>와 함께하는
          <br />
          모던 웹 애플리케이션
        </h1>
        <p className="hero-subtitle">
          빠르고, 안전하고, 확장 가능한 API를 경험해보세요
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
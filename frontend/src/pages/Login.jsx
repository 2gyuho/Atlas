import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 이미 로딩 중이면 중복 제출 방지
    if (loading) return;
    
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        navigate('/embassies');
      } else {
        setError(result.error);
        // 로그인 실패 시 입력 필드 초기화
        setFormData({
          email: '',
          password: ''
        });
      }
    } catch (error) {
      setError('로그인 중 오류가 발생했습니다.');
      setFormData({
        email: '',
        password: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-wrapper"
      >
        <Card className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">로그인</h2>
            <p className="auth-subtitle">계정에 로그인하세요</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">이메일</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="form-input"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              icon={<FiLogIn />}
            >
              로그인
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              아직 계정이 없으신가요?{' '}
              <Link to="/register" className="auth-link">
                회원가입
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;
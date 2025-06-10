import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiMapPin, FiPhone, FiLoader } from 'react-icons/fi';
import Card from '../components/Card';
import apiService from '../services/api';
import './Embassies.css';

const Embassies = () => {
  const [embassies, setEmbassies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmbassies();
  }, [currentPage, searchTerm]);

  const fetchEmbassies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      
      // URL에 쿼리 파라미터를 직접 포함
      let embassiesUrl = `/embassies?skip=${skip}&limit=${itemsPerPage}`;
      let countUrl = `/embassies/count`;
      
      if (searchTerm) {
        embassiesUrl += `&search=${encodeURIComponent(searchTerm)}`;
        countUrl += `?search=${encodeURIComponent(searchTerm)}`;
      }

      console.log('🔍 Fetching embassies from:', embassiesUrl);
      console.log('🔍 Fetching count from:', countUrl);

      const [embassiesRes, countRes] = await Promise.all([
        apiService.get(embassiesUrl),
        apiService.get(countUrl)
      ]);

      console.log('✅ Embassies response:', embassiesRes.data);
      console.log('✅ Count response:', countRes.data);

      setEmbassies(embassiesRes.data || []);
      setTotalCount(countRes.data?.count || 0);
      
    } catch (error) {
      console.error('❌ 대사관 정보를 불러오는데 실패했습니다:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      setError(`서버 연결 실패: ${error.message}`);
      setEmbassies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 테스트 함수들
  const testAPI = async () => {
    try {
      console.log('🧪 Testing API connection...');
      
      // 1. 기본 연결 테스트
      const healthRes = await apiService.get('/health');
      console.log('🟢 Health check:', healthRes.data);
      
      // 2. 컬렉션 목록 확인
      const collectionsRes = await apiService.get('/embassies/test/collections');
      console.log('📁 Collections:', collectionsRes.data);
      
      // 3. 샘플 데이터 확인
      const sampleRes = await apiService.get('/embassies/test/sample');
      console.log('📄 Sample data:', sampleRes.data);
      
    } catch (error) {
      console.error('🔴 API Test failed:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="embassies">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="embassies-header">
          <h1 className="embassies-title">전 세계 대사관 정보</h1>
          <p className="embassies-subtitle">
            전 세계 {totalCount}개의 대사관 정보를 확인하세요
          </p>
          
          {/* 디버그 버튼 */}
          <button 
            onClick={testAPI}
            style={{
              margin: '10px',
              padding: '8px 16px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🧪 API 테스트
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="대사관 이름 또는 주소로 검색..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </form>

        {loading ? (
          <div className="loading-container">
            <FiLoader className="loading-spinner" />
            <p>대사관 정보를 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="loading-container">
            <p style={{ color: '#ef4444' }}>❌ {error}</p>
            <button 
              onClick={fetchEmbassies}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                background: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              다시 시도
            </button>
          </div>
        ) : embassies.length === 0 ? (
          <div className="loading-container">
            <p>🔍 검색 결과가 없습니다.</p>
            <p>다른 검색어를 시도해보세요.</p>
          </div>
        ) : (
          <>
            <div className="embassies-grid">

              {embassies.map((embassy, index) => (
                <motion.div
                  key={embassy.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="embassy-card"
                >
                  <h3 className="embassy-name">{embassy.mission_name}</h3>
                  
                  <div className="info-item address">
                    <FiMapPin className="info-icon" />
                    <span className="info-text">{embassy.address}</span>
                  </div>
                  
                  <div className="info-item phone">
                    <FiPhone className="info-icon" />
                    <a 
                      href={`tel:${embassy.phone_number}`} 
                      className="info-link"
                    >
                      {embassy.phone_number}
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  이전
                </button>
                
                <span className="pagination-info">
                  {currentPage} / {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Embassies;
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

  useEffect(() => {
    fetchEmbassies();
  }, [currentPage, searchTerm]);

  const fetchEmbassies = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      
      // URL에 쿼리 파라미터를 직접 포함하는 방식으로 변경
      let embassiesUrl = `/embassies?skip=${skip}&limit=${itemsPerPage}`;
      let countUrl = `/embassies/count`;
      
      if (searchTerm) {
        embassiesUrl += `&search=${encodeURIComponent(searchTerm)}`;
        countUrl += `?search=${encodeURIComponent(searchTerm)}`;
      }

      console.log('Fetching embassies from:', embassiesUrl);
      console.log('Fetching count from:', countUrl);

      const [embassiesRes, countRes] = await Promise.all([
        apiService.get(embassiesUrl),
        apiService.get(countUrl)
      ]);

      console.log('Embassies response:', embassiesRes.data);
      console.log('Count response:', countRes.data);

      setEmbassies(embassiesRes.data);
      setTotalCount(countRes.data.count);
    } catch (error) {
      console.error('대사관 정보를 불러오는데 실패했습니다:', error);
      console.error('Error details:', error.response?.data);
      
      // 에러 발생 시 빈 배열로 설정
      setEmbassies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    // useEffect에서 searchTerm이 변경되면 자동으로 fetchEmbassies 호출됨
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
        ) : embassies.length === 0 ? (
          <div className="loading-container">
            <p>대사관 정보를 찾을 수 없습니다.</p>
            <p>서버가 실행 중인지 확인해주세요.</p>
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
                >
                  <Card className="embassy-card" hover>
                    <h3 className="embassy-name">{embassy.mission_name}</h3>
                    
                    <div className="embassy-info">
                      <div className="info-item">
                        <FiMapPin className="info-icon" />
                        <span className="info-text">{embassy.address}</span>
                      </div>
                      
                      <div className="info-item">
                        <FiPhone className="info-icon" />
                        <a 
                          href={`tel:${embassy.phone_number}`} 
                          className="info-link"
                        >
                          {embassy.phone_number}
                        </a>
                      </div>
                    </div>
                  </Card>
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
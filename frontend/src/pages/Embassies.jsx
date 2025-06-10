import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMapPin, FiPhone, FiLoader, FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi';
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
  const [expandedCards, setExpandedCards] = useState(new Set());

  useEffect(() => {
    fetchEmbassies();
  }, [currentPage, searchTerm]);

  const fetchEmbassies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      
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
      setError(`서버 연결 실패: ${error.message}`);
      setEmbassies([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
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

  // 페이지네이션 번호들을 생성하는 함수
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 끝 페이지가 조정되면 시작 페이지도 다시 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // 처음 페이지가 1이 아니면 1과 ... 추가
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('...');
      }
    }
    
    // 현재 범위의 페이지들 추가
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    // 마지막 페이지가 totalPages가 아니면 ... 과 마지막 페이지 추가
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const toggleExpanded = (embassyId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(embassyId)) {
      newExpanded.delete(embassyId);
    } else {
      newExpanded.add(embassyId);
    }
    setExpandedCards(newExpanded);
  };

  const isAddressLong = (address) => {
    return address && address.length > 60; // 60자 이상이면 긴 주소로 판단
  };

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
              {embassies.map((embassy, index) => {
                const isExpanded = expandedCards.has(embassy.id);
                const addressLong = isAddressLong(embassy.address);
                
                return (
                  <motion.div
                    key={embassy.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`embassy-card ${isExpanded ? 'expanded' : ''}`}
                  >
                    <h3 className="embassy-name">{embassy.mission_name}</h3>
                    
                    <div className="info-item address">
                      <FiMapPin className="info-icon" />
                      <div className="address-content">
                        <span className={`info-text ${addressLong ? 'truncated' : ''}`}>
                          {embassy.address}
                        </span>
                        {addressLong && (
                          <button 
                            onClick={() => toggleExpanded(embassy.id)}
                            className="expand-btn"
                            aria-label={isExpanded ? "주소 접기" : "주소 펼치기"}
                          >
                            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                          </button>
                        )}
                      </div>
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
                    
                    <AnimatePresence>
                      {isExpanded && addressLong && (
                        <motion.div 
                          className="expanded-address"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="expanded-content">
                            <FiMapPin className="info-icon" />
                            <span className="full-address">{embassy.address}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn pagination-arrow"
                >
                  <FiChevronLeft />
                </button>
                
                <div className="pagination-numbers">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageClick(page)}
                      className={`pagination-btn ${
                        page === currentPage ? 'active' : ''
                      } ${page === '...' ? 'disabled' : ''}`}
                      disabled={page === '...'}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn pagination-arrow"
                >
                  <FiChevronRight />
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
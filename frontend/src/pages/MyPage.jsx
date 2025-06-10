import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiGlobe, FiMapPin, FiPhone, FiExternalLink, FiCalendar, FiSearch } from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import './MyPage.css';

const MyPage = () => {
  const { user } = useAuth();
  const [selectedCountry, setSelectedCountry] = useState('');
  const [embassies, setEmbassies] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 국기 API URL 생성 함수
  const getFlagUrl = (countryCode, size = 64) => {
    // flagsapi.com 사용 (무료, 고품질)
    return `https://flagsapi.com/${countryCode}/flat/${size}.png`;
  };

  // 대체 국기 API (백업용)
  const getFlagUrlBackup = (countryCode) => {
    // flagcdn.com 사용
    return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  };

  // 주요 여행 국가 목록 - API 사용
  const countries = [
    { code: 'JP', name: '일본' },
    { code: 'US', name: '미국' },
    { code: 'GB', name: '영국' },
    { code: 'FR', name: '프랑스' },
    { code: 'DE', name: '독일' },
    { code: 'IT', name: '이탈리아' },
    { code: 'ES', name: '스페인' },
    { code: 'CA', name: '캐나다' },
    { code: 'AU', name: '호주' },
    { code: 'TH', name: '태국' },
    { code: 'VN', name: '베트남' },
    { code: 'SG', name: '싱가포르' },
    { code: 'CN', name: '중국' },
    { code: 'IN', name: '인도' },
    { code: 'BR', name: '브라질' },
    { code: 'MX', name: '멕시코' },
    { code: 'RU', name: '러시아' },
  ];

  // 국가명 매핑 (한국어 -> 영어)
  const countryMapping = {
    '일본': ['Japan', 'Tokyo', 'Japanese'],
    '미국': ['United States', 'USA', 'America', 'US', 'American'],
    '영국': ['United Kingdom', 'England', 'Wales', 'Scotland', 'UK', 'Britain', 'British', 'London', 'Glasgow', 'Manchester'],
    '프랑스': ['France', 'Paris', 'French'],
    '독일': ['Germany', 'Deutschland', 'German', 'Berlin'],
    '이탈리아': ['Italy', 'Italia', 'Italian', 'Rome'],
    '스페인': ['Spain', 'España', 'Spanish', 'Madrid', 'Barcelona'],
    '캐나다': ['Canada', 'Canadian'],
    '호주': ['Australia', 'Australian', 'Sydney', 'Melbourne'],
    '태국': ['Thailand', 'Thai', 'Bangkok'],
    '베트남': ['Vietnam', 'Vietnamese'],
    '싱가포르': ['Singapore', 'Singaporean'],
    '중국': ['China', 'Chinese', 'Beijing'],
    '인도': ['India', 'Indian'],
    '브라질': ['Brazil', 'Brazilian'],
    '멕시코': ['Mexico', 'Mexican'],
    '러시아': ['Russia', 'Russian'],
  };

  // 나라 선택 시 데이터 가져오기
  const fetchCountryData = async (countryName) => {
    setLoading(true);
    setError('');
    
    try {
      // 대사관 정보 가져오기
      const embassyResponse = await apiService.get(`/embassies?search=${countryName}&limit=10`);
      setEmbassies(embassyResponse.data || []);

      // 뉴스 정보 가져오기 - 영어 국가명으로 검색
      const englishNames = countryMapping[countryName] || [countryName];
      
      // 모든 영어 국가명을 콤마로 연결해서 한 번에 요청
      const searchTerms = englishNames.join(',');
      
      console.log(`🔍 Searching news for ${countryName} with terms: ${searchTerms}`);
      
      try {
        const newsResponse = await apiService.get(`/news?country=${encodeURIComponent(searchTerms)}&limit=5`);
        console.log('📰 News API response:', newsResponse);
        console.log('📰 News data:', newsResponse.data);
        
        if (newsResponse.data && newsResponse.data.length > 0) {
          console.log(`✅ Found ${newsResponse.data.length} news articles`);
          setNews(newsResponse.data);
        } else {
          console.log('⚠️ No news found, using dummy data');
          // 뉴스가 없으면 더미 데이터 사용
          setNews([
            {
              id: 1,
              title: `${countryName} 여행 안전 정보`,
              content: `${countryName} 여행 시 주의사항과 안전 정보입니다.`,
              date: '2024-01-15',
              source: '외교부',
              category: '안전정보'
            },
            {
              id: 2,
              title: `${countryName} 입국 규정 변경`,
              content: `${countryName} 입국 시 새로운 규정이 적용됩니다.`,
              date: '2024-01-10',
              source: '한국관광공사',
              category: '입국정보'
            }
          ]);
        }
      } catch (newsError) {
        console.log(`❌ News API error for ${countryName}:`, newsError);
        // 뉴스 API 오류 시에도 더미 데이터 사용
        setNews([
          {
            id: 1,
            title: `${countryName} 여행 안전 정보`,
            content: `${countryName} 여행 시 주의사항과 안전 정보입니다.`,
            date: '2024-01-15',
            source: '외교부',
            category: '안전정보'
          },
          {
            id: 2,
            title: `${countryName} 입국 규정 변경`,
            content: `${countryName} 입국 시 새로운 규정이 적용됩니다.`,
            date: '2024-01-10',
            source: '한국관광공사',
            category: '입국정보'
          }
        ]);
      }
    } catch (err) {
      setError('데이터를 가져오는 중 오류가 발생했습니다.');
      console.error('Error fetching country data:', err);
      
      // 오류 발생 시 더미 데이터 사용
      setNews([
        {
          id: 1,
          title: `${countryName} 여행 안전 정보`,
          content: `${countryName} 여행 시 주의사항과 안전 정보입니다.`,
          date: '2024-01-15',
          source: '외교부',
          category: '안전정보'
        },
        {
          id: 2,
          title: `${countryName} 입국 규정 변경`,
          content: `${countryName} 입국 시 새로운 규정이 적용됩니다.`,
          date: '2024-01-10',
          source: '한국관광공사',
          category: '입국정보'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    fetchCountryData(country.name);
  };

  // 국기 이미지 로드 에러 처리
  const handleFlagError = (e, countryCode) => {
    console.log(`Flag loading failed for ${countryCode}, trying backup...`);
    e.target.src = getFlagUrlBackup(countryCode);
    e.target.onerror = () => {
      console.log(`Backup flag also failed for ${countryCode}`);
      // 마지막 대안으로 빈 이미지나 플레이스홀더 표시
      e.target.style.display = 'none';
      e.target.nextSibling.textContent = countryCode; // 국가 코드 표시
    };
  };

  return (
    <div className="mypage">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mypage-header">
          <div className="user-info">
            <div className="user-avatar">
              <FiUser />
            </div>
            <div className="user-details">
              <h1 className="mypage-title">마이페이지</h1>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
        </div>

        <motion.section
          className="travel-planner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <div className="section-header">
              <h2 className="section-title">
                <FiGlobe className="section-icon" />
                여행 계획
              </h2>
              <p className="section-subtitle">여행할 나라를 선택하여 관련 정보를 확인하세요</p>
            </div>

            <div className="country-grid">
              {countries.map((country) => (
                <motion.div
                  key={country.code}
                  className={`country-card ${selectedCountry.code === country.code ? 'selected' : ''}`}
                  onClick={() => handleCountrySelect(country)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="country-flag-container">
                    <img 
                      src={getFlagUrl(country.code)} 
                      alt={`${country.name} 국기`}
                      className="country-flag-img"
                      loading="lazy"
                      onError={(e) => handleFlagError(e, country.code)}
                    />
                    <span className="country-code-fallback">{country.code}</span>
                  </div>
                  <div className="country-name">{country.name}</div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.section>

        {selectedCountry && (
          <motion.section
            className="country-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="country-info-header">
              <h2 className="country-title">
                <img 
                  src={getFlagUrl(selectedCountry.code, 32)} 
                  alt={`${selectedCountry.name} 국기`}
                  className="country-title-flag"
                  onError={(e) => handleFlagError(e, selectedCountry.code)}
                />
                {selectedCountry.name} 여행 정보
              </h2>
            </div>

            <div className="info-grid">
              {/* 대사관 정보 */}
              <motion.div
                className="info-section"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card>
                  <div className="section-header">
                    <h3 className="section-title">
                      <FiMapPin className="section-icon" />
                      대사관 정보
                    </h3>
                  </div>
                  
                  {loading ? (
                    <div className="loading">정보를 가져오는 중...</div>
                  ) : embassies.length > 0 ? (
                    <div className="embassy-list">
                      {embassies.slice(0, 3).map((embassy) => (
                        <div key={embassy.id} className="embassy-item">
                          <h4 className="embassy-name">{embassy.mission_name}</h4>
                          <div className="embassy-details">
                            <div className="embassy-address">
                              <FiMapPin className="detail-icon" />
                              <span>{embassy.address}</span>
                            </div>
                            {embassy.phone_number && (
                              <div className="embassy-phone">
                                <FiPhone className="detail-icon" />
                                <a href={`tel:${embassy.phone_number}`}>
                                  {embassy.phone_number}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data">해당 국가의 대사관 정보가 없습니다.</div>
                  )}
                </Card>
              </motion.div>

              {/* 뉴스 정보 */}
              <motion.div
                className="info-section"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card>
                  <div className="section-header">
                    <h3 className="section-title">
                      <FiExternalLink className="section-icon" />
                      관련 뉴스
                    </h3>
                  </div>
                  <div className="news-list">
                    {news.map((newsItem) => (
                      <div key={newsItem.id} className="news-item">
                        <div className="news-header">
                          <h4 className="news-title">{newsItem.title}</h4>
                          {newsItem.category && (
                            <span className="news-category">{newsItem.category}</span>
                          )}
                        </div>
                        <div className="news-meta">
                          <span className="news-source">{newsItem.source}</span>
                          <span className="news-date">
                            <FiCalendar className="meta-icon" />
                            {newsItem.published || newsItem.date}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </motion.section>
        )}
      </motion.div>
    </div>
  );
};

export default MyPage;
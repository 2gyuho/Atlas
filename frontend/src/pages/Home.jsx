import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiArrowRight, FiBell, FiPhone, FiUser, FiGlobe, FiMapPin, 
  FiExternalLink, FiCalendar, FiChevronDown, FiChevronUp,
  FiLoader
} from 'react-icons/fi';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 여행지 정보 상태
  const [selectedCountry, setSelectedCountry] = useState('');
  const [embassies, setEmbassies] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllCountries, setShowAllCountries] = useState(false);

  // 국기 API URL 생성 함수
  const getFlagUrl = (countryCode, size = 64) => {
    return `https://flagsapi.com/${countryCode}/flat/${size}.png`;
  };

  const getFlagUrlBackup = (countryCode) => {
    return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  };

  // 국가와 주요 도시 데이터
  const countriesWithCities = {
    'JP': { name: '일본' },
    'US': { name: '미국' },
    'GB': { name: '영국' },
    'FR': { name: '프랑스' },
    'DE': { name: '독일' },
    'IT': { name: '이탈리아' },
    'ES': { name: '스페인' },
    'CA': { name: '캐나다' },
    'AU': { name: '호주' },
    'TH': { name: '태국' },
    'VN': { name: '베트남' },
    'SG': { name: '싱가포르' },
    'CN': { name: '중국' },
    'IN': { name: '인도' },
    'BR': { name: '브라질' },
    'MX': { name: '멕시코' },
    'RU': { name: '러시아' },
    'KR': { name: '한국' },
    'NL': { name: '네덜란드' },
    'BE': { name: '벨기에' }
  };

  const allCountries = Object.keys(countriesWithCities).map(code => ({
    code,
    name: countriesWithCities[code].name
  }));

  const popularCountries = allCountries.slice(0, 12);
  const displayedCountries = showAllCountries ? allCountries : popularCountries;

  // 국가명 매핑
  const countryMapping = {
    '일본': ['Japan', 'Tokyo', 'Japanese'],
    '미국': ['United States', 'USA', 'America', 'US', 'American'],
    '영국': ['United Kingdom', 'England', 'Wales', 'Scotland', 'UK', 'Britain', 'British'],
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
    '한국': ['Korea', 'Korean', 'South Korea']
  };

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

  // 나라 선택 시 데이터 가져오기
  const fetchCountryData = async (countryName) => {
    setLoading(true);
    setError('');
    
    try {
      const embassyResponse = await apiService.get(`/embassies?search=${countryName}&limit=10`);
      setEmbassies(embassyResponse.data || []);

      const englishNames = countryMapping[countryName] || [countryName];
      const searchTerms = englishNames.join(',');
      
      try {
        const newsResponse = await apiService.get(`/news?country=${encodeURIComponent(searchTerms)}&limit=5`);
        
        if (newsResponse.data && newsResponse.data.length > 0) {
          setNews(newsResponse.data);
        } else {
          setNews([
            {
              id: 1,
              title: `${countryName} 여행 안전 정보`,
              content: `${countryName} 여행 시 주의사항과 안전 정보입니다.`,
              date: '2024-01-15',
              source: '외교부',
              category: '안전정보'
            }
          ]);
        }
      } catch (newsError) {
        setNews([
          {
            id: 1,
            title: `${countryName} 여행 안전 정보`,
            content: `${countryName} 여행 시 주의사항과 안전 정보입니다.`,
            date: '2024-01-15',
            source: '외교부',
            category: '안전정보'
          }
        ]);
      }
    } catch (err) {
      setError('데이터를 가져오는 중 오류가 발생했습니다.');
      console.error('Error fetching country data:', err);
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
    e.target.src = getFlagUrlBackup(countryCode);
    e.target.onerror = () => {
      e.target.style.display = 'none';
      if (e.target.nextSibling) {
        e.target.nextSibling.textContent = countryCode;
      }
    };
  };

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

      </motion.section>



      {/* 여행지 정보 섹션 */}
      <motion.section
        className="travel-info-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card>
          <div className="section-header">
            <h2 className="section-title">
              <FiGlobe className="section-icon" />
              여행지 정보
            </h2>
            <p className="section-subtitle">여행할 나라를 선택하여 관련 정보를 확인하세요</p>
          </div>

          <div className="country-grid">
            {displayedCountries.map((country) => (
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

          {/* 더보기/접기 버튼 */}
          <div className="show-more-container">
            <button
              onClick={() => setShowAllCountries(!showAllCountries)}
              className="show-more-btn"
            >
              {showAllCountries ? (
                <>
                  <FiChevronUp />
                  접기
                </>
              ) : (
                <>
                  <FiChevronDown />
                  더 많은 국가 보기 ({allCountries.length - popularCountries.length}개 더)
                </>
              )}
            </button>
          </div>
        </Card>
      </motion.section>

      {/* 선택된 국가 정보 */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.section
            className="country-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                    <div className="loading">
                      <FiLoader className="loading-spinner" />
                      정보를 가져오는 중...
                    </div>
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
      </AnimatePresence>
    </div>
  );
};

export default Home;
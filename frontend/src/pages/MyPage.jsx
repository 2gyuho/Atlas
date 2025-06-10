import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiGlobe, FiMapPin, FiPhone, FiExternalLink, FiCalendar, 
  FiSearch, FiPlus, FiEdit3, FiTrash2, FiSave, FiX, FiChevronDown, 
  FiChevronUp, FiNavigation, FiClock, FiMap
} from 'react-icons/fi';
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
  
  // 여행 계획 관련 상태
  const [travelPlans, setTravelPlans] = useState([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    title: '',
    country: '',
    city: '',
    departureDate: '',
    returnDate: '',
    stopovers: [], // 경유지 배열
    notes: ''
  });
  
  // UI 상태
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  // 국기 API URL 생성 함수
  const getFlagUrl = (countryCode, size = 64) => {
    return `https://flagsapi.com/${countryCode}/flat/${size}.png`;
  };

  const getFlagUrlBackup = (countryCode) => {
    return `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  };

  // 국가와 주요 도시 데이터
  const countriesWithCities = {
    'JP': { 
      name: '일본', 
      cities: ['도쿄', '오사카', '교토', '요코하마', '나고야', '삿포로', '고베', '후쿠오카', '나라', '히로시마']
    },
    'US': { 
      name: '미국', 
      cities: ['뉴욕', '로스앤젤레스', '시카고', '휴스턴', '피닉스', '필라델피아', '샌안토니오', '샌디에이고', '댈러스', '샌프란시스코', '라스베이거스', '마이애미', '시애틀', '보스턴', '워싱턴 D.C.']
    },
    'GB': { 
      name: '영국', 
      cities: ['런던', '맨체스터', '버밍엄', '글래스고', '리버풀', '에든버러', '리즈', '셰필드', '브리스톨', '카디프']
    },
    'FR': { 
      name: '프랑스', 
      cities: ['파리', '마르세유', '리옹', '툴루즈', '니스', '낭트', '스트라스부르', '몽펠리에', '보르도', '릴']
    },
    'DE': { 
      name: '독일', 
      cities: ['베를린', '함부르크', '뮌헨', '쾰른', '프랑크푸르트', '슈투트가르트', '뒤셀도르프', '도르트문트', '에센', '라이프치히']
    },
    'IT': { 
      name: '이탈리아', 
      cities: ['로마', '밀라노', '나폴리', '토리노', '팔레르모', '제노바', '볼로냐', '피렌체', '바리', '카타니아', '베니스', '베로나']
    },
    'ES': { 
      name: '스페인', 
      cities: ['마드리드', '바르셀로나', '발렌시아', '세비야', '사라고사', '말라가', '무르시아', '팔마', '라스팔마스', '빌바오']
    },
    'CA': { 
      name: '캐나다', 
      cities: ['토론토', '몬트리올', '밴쿠버', '칼가리', '에드먼턴', '오타와', '위니펙', '퀘벡시티', '해밀턴', '키치너']
    },
    'AU': { 
      name: '호주', 
      cities: ['시드니', '멜버른', '브리즈번', '퍼스', '애들레이드', '골드코스트', '뉴캐슬', '캔버라', '울런공', '선샤인코스트']
    },
    'TH': { 
      name: '태국', 
      cities: ['방콕', '치앙마이', '파타야', '푸켓', '후아힌', '크라비', '아유타야', '치앙라이', '코사무이', '우본']
    },
    'VN': { 
      name: '베트남', 
      cities: ['호치민시', '하노이', '다낭', '나트랑', '후에', '호이안', '달랏', '무이네', '하롱베이', '사파']
    },
    'SG': { 
      name: '싱가포르', 
      cities: ['싱가포르']
    },
    'CN': { 
      name: '중국', 
      cities: ['베이징', '상하이', '광저우', '심천', '천진', '우한', '시안', '청두', '난징', '항저우', '대련', '칭다오']
    },
    'IN': { 
      name: '인도', 
      cities: ['뉴델리', '뭄바이', '콜카타', '첸나이', '방갈로르', '하이데라바드', '아메다바드', '푸네', '수랏', '자이푸르']
    },
    'BR': { 
      name: '브라질', 
      cities: ['상파울루', '리우데자네이루', '브라질리아', '살바도르', '포르탈레자', '벨루오리존치', '마나우스', '쿠리치바', '헤시피', '포르투알레그리']
    },
    'MX': { 
      name: '멕시코', 
      cities: ['멕시코시티', '과달라하라', '몬테레이', '푸에블라', '티후아나', '레온', '후아레스', '토레온', '케레타로', '칸쿤']
    },
    'RU': { 
      name: '러시아', 
      cities: ['모스크바', '상트페테르부르크', '노보시비르스크', '예카테린부르크', '니즈니노브고로드', '삼성', '옴스크', '카잔', '첼랴빈스크', '로스토프나도누']
    },
    'KR': { 
      name: '한국', 
      cities: ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '수원', '고양', '용인', '제주도', '강릉']
    },
    'NL': { 
      name: '네덜란드', 
      cities: ['암스테르담', '로테르담', '헤이그', '위트레흐트', '에인트호번', '틸뷔르흐', '흐로닝언', '알메러', '브레다', '네이메헌']
    },
    'BE': { 
      name: '벨기에', 
      cities: ['브뤼셀', '안트베르펜', '겐트', '샤를루아', '리에주', '브뤼헤', '남뤼르', '뢰번', '몽스', '알스트']
    }
  };

  const allCountries = Object.keys(countriesWithCities).map(code => ({
    code,
    name: countriesWithCities[code].name
  }));

  const popularCountries = allCountries.slice(0, 12);
  const displayedCountries = showAllCountries ? allCountries : popularCountries;

  // 필터된 국가 목록
  const filteredCountries = Object.entries(countriesWithCities)
    .filter(([code, data]) => 
      data.name.toLowerCase().includes(countrySearch.toLowerCase())
    )
    .map(([code, data]) => ({ code, name: data.name }));

  // 필터된 도시 목록
  const filteredCities = planForm.country 
    ? countriesWithCities[planForm.country]?.cities.filter(city =>
        city.toLowerCase().includes(citySearch.toLowerCase())
      ) || []
    : [];

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

  // 컴포넌트 마운트 시 여행 계획 로드
  useEffect(() => {
    loadTravelPlans();
  }, []);

  // 클릭 외부 감지를 위한 useEffect
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowCountryDropdown(false);
        setShowCityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 여행 계획 로드
  const loadTravelPlans = () => {
    try {
      const savedPlans = localStorage.getItem('travelPlans');
      if (savedPlans) {
        setTravelPlans(JSON.parse(savedPlans));
      }
    } catch (error) {
      console.error('여행 계획 로드 실패:', error);
    }
  };

  // 여행 계획 저장
  const saveTravelPlans = (plans) => {
    try {
      localStorage.setItem('travelPlans', JSON.stringify(plans));
      setTravelPlans(plans);
    } catch (error) {
      console.error('여행 계획 저장 실패:', error);
    }
  };

  // 경유지 추가
  const addStopover = () => {
    setPlanForm({
      ...planForm,
      stopovers: [...planForm.stopovers, { country: '', city: '', days: 1 }]
    });
  };

  // 경유지 제거
  const removeStopover = (index) => {
    setPlanForm({
      ...planForm,
      stopovers: planForm.stopovers.filter((_, i) => i !== index)
    });
  };

  // 경유지 업데이트
  const updateStopover = (index, field, value) => {
    const updatedStopovers = planForm.stopovers.map((stopover, i) => 
      i === index ? { ...stopover, [field]: value } : stopover
    );
    setPlanForm({ ...planForm, stopovers: updatedStopovers });
  };

  // 여행 계획 저장
  const handleSavePlan = () => {
    if (!planForm.title || !planForm.country || !planForm.city || !planForm.departureDate || !planForm.returnDate) {
      alert('제목, 목적지, 출발일, 귀국일은 필수 항목입니다.');
      return;
    }

    if (new Date(planForm.departureDate) >= new Date(planForm.returnDate)) {
      alert('돌아오는 날짜는 가는 날짜보다 나중이어야 합니다.');
      return;
    }

    const newPlan = {
      id: editingPlan ? editingPlan.id : Date.now(),
      ...planForm,
      countryName: countriesWithCities[planForm.country]?.name || planForm.country,
      createdAt: editingPlan ? editingPlan.createdAt : new Date().toISOString()
    };

    let updatedPlans;
    if (editingPlan) {
      updatedPlans = travelPlans.map(plan => plan.id === editingPlan.id ? newPlan : plan);
    } else {
      updatedPlans = [...travelPlans, newPlan];
    }

    saveTravelPlans(updatedPlans);
    resetPlanForm();
  };

  // 여행 계획 삭제
  const handleDeletePlan = (planId) => {
    if (window.confirm('이 여행 계획을 삭제하시겠습니까?')) {
      const updatedPlans = travelPlans.filter(plan => plan.id !== planId);
      saveTravelPlans(updatedPlans);
    }
  };

  // 여행 계획 수정 시작
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      title: plan.title || '',
      country: plan.country || '',
      city: plan.city || '',
      departureDate: plan.departureDate || '',
      returnDate: plan.returnDate || '',
      stopovers: plan.stopovers || [],
      notes: plan.notes || ''
    });
    setShowPlanForm(true);
  };

  // 폼 리셋
  const resetPlanForm = () => {
    setPlanForm({
      title: '',
      country: '',
      city: '',
      departureDate: '',
      returnDate: '',
      stopovers: [],
      notes: ''
    });
    setEditingPlan(null);
    setShowPlanForm(false);
    setShowCountryDropdown(false);
    setShowCityDropdown(false);
    setCountrySearch('');
    setCitySearch('');
  };

  // 국가 선택
  const selectCountry = (countryCode, countryName) => {
    setPlanForm({ ...planForm, country: countryCode, city: '' });
    setCountrySearch(countryName);
    setShowCountryDropdown(false);
    setCitySearch('');
  };

  // 도시 선택
  const selectCity = (cityName) => {
    setPlanForm({ ...planForm, city: cityName });
    setCitySearch(cityName);
    setShowCityDropdown(false);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 여행 일수 계산
  const calculateDays = (departure, returnDate) => {
    const start = new Date(departure);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

        {/* 여행 계획 섹션 */}
        <motion.section
          className="travel-plans-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card>
            <div className="section-header">
              <div className="section-title-row">
                <h2 className="section-title">
                  <FiCalendar className="section-icon" />
                  나의 여행 계획
                </h2>
                <Button
                  onClick={() => setShowPlanForm(true)}
                  icon={<FiPlus />}
                  size="sm"
                >
                  새 계획 추가
                </Button>
              </div>
              <p className="section-subtitle">상세한 여행 계획을 세우고 관리하세요</p>
            </div>

            {/* 여행 계획 폼 */}
            <AnimatePresence>
              {showPlanForm && (
                <motion.div
                  className="plan-form-container"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="plan-form">
                    <div className="form-header">
                      <h3>{editingPlan ? '여행 계획 수정' : '새 여행 계획'}</h3>
                      <button onClick={resetPlanForm} className="close-btn">
                        <FiX />
                      </button>
                    </div>
                    
                    <div className="form-grid">
                      {/* 여행 제목 */}
                      <div className="form-group full-width">
                        <label>여행 제목 *</label>
                        <input
                          type="text"
                          value={planForm.title}
                          onChange={(e) => setPlanForm({...planForm, title: e.target.value})}
                          placeholder="예: 일본 도쿄 벚꽃 여행"
                          className="form-input"
                        />
                      </div>

                      {/* 목적지 국가 */}
                      <div className="form-group">
                        <label>목적지 국가 *</label>
                        <div className="dropdown-container">
                          <div 
                            className="dropdown-input"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          >
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="국가를 선택하세요"
                              className="form-input"
                              onFocus={() => setShowCountryDropdown(true)}
                            />
                            <FiChevronDown className="dropdown-arrow" />
                          </div>
                          {showCountryDropdown && (
                            <div className="dropdown-menu">
                              {filteredCountries.map(country => (
                                <div
                                  key={country.code}
                                  className="dropdown-item"
                                  onClick={() => selectCountry(country.code, country.name)}
                                >
                                  <img 
                                    src={getFlagUrl(country.code, 24)} 
                                    alt={country.name}
                                    className="dropdown-flag"
                                    onError={(e) => handleFlagError(e, country.code)}
                                  />
                                  {country.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 목적지 도시 */}
                      <div className="form-group">
                        <label>목적지 도시 *</label>
                        <div className="dropdown-container">
                          <div 
                            className="dropdown-input"
                            onClick={() => setShowCityDropdown(!showCityDropdown)}
                          >
                            <input
                              type="text"
                              value={citySearch}
                              onChange={(e) => setCitySearch(e.target.value)}
                              placeholder="도시를 선택하세요"
                              className="form-input"
                              disabled={!planForm.country}
                              onFocus={() => planForm.country && setShowCityDropdown(true)}
                            />
                            <FiChevronDown className="dropdown-arrow" />
                          </div>
                          {showCityDropdown && planForm.country && (
                            <div className="dropdown-menu">
                              {filteredCities.map(city => (
                                <div
                                  key={city}
                                  className="dropdown-item"
                                  onClick={() => selectCity(city)}
                                >
                                  <FiMapPin className="dropdown-icon" />
                                  {city}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 출발일 */}
                      <div className="form-group">
                        <label>출발일 *</label>
                        <input
                          type="date"
                          value={planForm.departureDate}
                          onChange={(e) => setPlanForm({...planForm, departureDate: e.target.value})}
                          className="form-input"
                        />
                      </div>
                      
                      {/* 귀국일 */}
                      <div className="form-group">
                        <label>귀국일 *</label>
                        <input
                          type="date"
                          value={planForm.returnDate}
                          onChange={(e) => setPlanForm({...planForm, returnDate: e.target.value})}
                          className="form-input"
                        />
                      </div>
                    </div>

                    {/* 경유지 섹션 */}
                    <div className="stopovers-section">
                      <div className="stopovers-header">
                        <h4>
                          <FiNavigation className="section-icon" />
                          경유지 (선택사항)
                        </h4>
                        <Button 
                          onClick={addStopover}
                          size="sm"
                          variant="ghost"
                          icon={<FiPlus />}
                        >
                          경유지 추가
                        </Button>
                      </div>
                      
                      {planForm.stopovers.map((stopover, index) => (
                        <motion.div
                          key={index}
                          className="stopover-item"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="stopover-header">
                            <span className="stopover-number">{index + 1}</span>
                            <button
                              onClick={() => removeStopover(index)}
                              className="remove-stopover-btn"
                            >
                              <FiX />
                            </button>
                          </div>
                          
                          <div className="stopover-form">
                            <div className="form-group">
                              <label>경유 국가</label>
                              <select
                                value={stopover.country}
                                onChange={(e) => updateStopover(index, 'country', e.target.value)}
                                className="form-input"
                              >
                                <option value="">국가 선택</option>
                                {Object.entries(countriesWithCities).map(([code, data]) => (
                                  <option key={code} value={code}>{data.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label>경유 도시</label>
                              <select
                                value={stopover.city}
                                onChange={(e) => updateStopover(index, 'city', e.target.value)}
                                className="form-input"
                                disabled={!stopover.country}
                              >
                                <option value="">도시 선택</option>
                                {stopover.country && countriesWithCities[stopover.country]?.cities.map(city => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="form-group">
                              <label>체류 일수</label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={stopover.days}
                                onChange={(e) => updateStopover(index, 'days', parseInt(e.target.value) || 1)}
                                className="form-input"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* 메모 */}
                    <div className="form-group full-width">
                      <label>여행 메모</label>
                      <textarea
                        value={planForm.notes}
                        onChange={(e) => setPlanForm({...planForm, notes: e.target.value})}
                        placeholder="여행 관련 메모를 입력하세요..."
                        className="form-textarea"
                        rows={3}
                      />
                    </div>
                    
                    <div className="form-actions">
                      <Button onClick={resetPlanForm} variant="ghost">
                        취소
                      </Button>
                      <Button onClick={handleSavePlan} icon={<FiSave />}>
                        {editingPlan ? '수정' : '저장'}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 여행 계획 목록 */}
            <div className="travel-plans-list">
              {travelPlans.length === 0 ? (
                <div className="no-plans">
                  <FiCalendar className="no-plans-icon" />
                  <p>아직 여행 계획이 없습니다.</p>
                  <p>첫 번째 여행 계획을 세워보세요!</p>
                </div>
              ) : (
                <div className="plans-grid">
                  {travelPlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      className="travel-plan-card"
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="plan-header">
                        <div className="plan-title-section">
                          <h4 className="plan-title">{plan.title}</h4>
                          <div className="plan-destination-info">
                            {plan.country && (
                              <img 
                                src={getFlagUrl(plan.country, 20)} 
                                alt={plan.countryName}
                                className="plan-flag"
                                onError={(e) => handleFlagError(e, plan.country)}
                              />
                            )}
                            <span className="plan-destination">
                              {plan.countryName} - {plan.city}
                            </span>
                          </div>
                        </div>
                        <div className="plan-actions">
                          <button 
                            onClick={() => handleEditPlan(plan)}
                            className="action-btn edit"
                          >
                            <FiEdit3 />
                          </button>
                          <button 
                            onClick={() => handleDeletePlan(plan.id)}
                            className="action-btn delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      
                      <div className="plan-dates">
                        <div className="date-info">
                          <span className="date-label">출발</span>
                          <span className="date-value">{formatDate(plan.departureDate)}</span>
                        </div>
                        <div className="date-separator">→</div>
                        <div className="date-info">
                          <span className="date-label">귀국</span>
                          <span className="date-value">{formatDate(plan.returnDate)}</span>
                        </div>
                      </div>
                      
                      <div className="plan-duration">
                        <FiClock className="duration-icon" />
                        {calculateDays(plan.departureDate, plan.returnDate)}일간의 여행
                      </div>

                      {/* 경유지 표시 */}
                      {plan.stopovers && plan.stopovers.length > 0 && (
                        <div className="plan-stopovers">
                          <h5 className="stopovers-title">
                            <FiMap className="stopovers-icon" />
                            경유지
                          </h5>
                          <div className="stopovers-list">
                            {plan.stopovers.map((stopover, index) => (
                              <div key={index} className="stopover-item-display">
                                {stopover.country && (
                                  <img 
                                    src={getFlagUrl(stopover.country, 16)} 
                                    alt={countriesWithCities[stopover.country]?.name}
                                    className="stopover-flag"
                                    onError={(e) => handleFlagError(e, stopover.country)}
                                  />
                                )}
                                <span className="stopover-location">
                                  {countriesWithCities[stopover.country]?.name} - {stopover.city}
                                </span>
                                <span className="stopover-days">({stopover.days}일)</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {plan.notes && (
                        <div className="plan-notes">
                          {plan.notes}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.section>

        {/* 국가 선택 섹션 */}
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
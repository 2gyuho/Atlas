import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 에러가 발생했을 때 대사관 페이지에서만 로그인 페이지로 리다이렉트하지 않음
    // 로그인/회원가입 페이지에서는 리다이렉트하지 않음
    if (error.response?.status === 401) {
      const isEmbassyRoute = window.location.pathname.includes('/embassies');
      const isAuthRoute = window.location.pathname.includes('/login') || 
                         window.location.pathname.includes('/register');
      
      if (!isEmbassyRoute && !isAuthRoute) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API 메서드들
const apiService = {
  // GET 요청
  get: (endpoint) => api.get(endpoint),
  
  // POST 요청
  post: (endpoint, data) => api.post(endpoint, data),
  
  // PUT 요청
  put: (endpoint, data) => api.put(endpoint, data),
  
  // DELETE 요청
  delete: (endpoint) => api.delete(endpoint),
  
  // 파일 업로드
  uploadFile: (endpoint, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 여행계획 관련 API
  travel: {
    // 여행계획 생성
    create: (travelData) => api.post('/api/travels/', travelData),
    
    // 모든 여행계획 조회
    getAll: () => api.get('/api/travels/'),
    
    // 특정 여행계획 조회
    getById: (id) => api.get(`/api/travels/${id}`),
    
    // 여행계획 수정
    update: (id, travelData) => api.put(`/api/travels/${id}`, travelData),
    
    // 여행계획 삭제
    delete: (id) => api.delete(`/api/travels/${id}`)
  }
};

export default apiService;
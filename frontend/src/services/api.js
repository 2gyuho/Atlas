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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
};

export default apiService;
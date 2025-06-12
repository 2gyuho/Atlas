# GPS 기반 실시간 위험 알림 시스템

## 📖 개요

이 시스템은 사용자의 GPS 위치를 기반으로 MongoDB에 저장된 영어 뉴스 데이터를 실시간으로 분석하여 범죄, 자연재해, 살인 등의 주요 위험 사건을 감지하고 이메일 알림을 보내는 시스템입니다.

## 🏗️ 시스템 아키텍처

### Backend (FastAPI)
- **프레임워크**: FastAPI (Python)
- **데이터베이스**: 
  - MongoDB: 뉴스 데이터 저장
  - MySQL: 사용자 정보 및 설정 저장
- **실시간 모니터링**: 백그라운드 태스크로 5분마다 위험 상황 체크
- **이메일 서비스**: SMTP를 통한 알림 이메일 발송

### Frontend (React)
- **프레임워크**: React.js
- **UI**: 사용자 친화적인 알림 설정 인터페이스
- **위치 서비스**: HTML5 Geolocation API 사용

## 🚀 주요 기능

### 1. 사용자 관리
- 회원가입/로그인 시스템
- JWT 기반 인증
- 개별 사용자별 알림 설정

### 2. 위치 기반 알림
- GPS 위치 자동 업데이트
- 사용자 설정 가능한 알림 반경 (1-200km)
- 실시간 위치 기반 위험 상황 감지

### 3. 지능형 위험 감지
- 영어 뉴스 키워드 분석
- 위험도별 분류 (High/Medium/Low)
- 카테고리별 분석 (범죄/자연재해/공공안전)

### 4. 실시간 알림 시스템
- 이메일 알림 (HTML 형식)
- 알림 중복 방지 (최소 1시간 간격)
- 테스트 알림 기능

## 🔧 설정 및 설치

### 환경 변수 설정
```bash
# MongoDB 설정
MONGODB_URL=mongodb://username:password@host/
DATABASE_NAME=devine

# MySQL 설정
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=atlas
MYSQL_PORT=3306

# JWT 설정
SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google Maps API 설정
GEO_API_KEY=your_google_maps_api_key_here

# 이메일 설정 (Gmail 기준)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 백엔드 설치 및 실행
```bash
cd backend
pip install -r requirements.txt
python scripts/update_user_table.py  # 데이터베이스 테이블 업데이트
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 프론트엔드 설치 및 실행
```bash
cd frontend
npm install
npm start
```

## 📋 API 엔드포인트

### 알림 관련 API (`/api/alerts`)

#### `PUT /api/alerts/location`
사용자 현재 위치 업데이트
```json
{
  "latitude": 37.5665,
  "longitude": 126.9780
}
```

#### `PUT /api/alerts/settings`
알림 설정 업데이트
```json
{
  "alert_enabled": true,
  "alert_radius_km": 50
}
```

#### `GET /api/alerts/settings`
현재 알림 설정 조회

#### `GET /api/alerts/check`
현재 위치의 위험 상황 즉시 체크

#### `GET /api/alerts/nearby-dangers`
주변 위험 상황 목록 조회

#### `POST /api/alerts/test-email`
테스트 알림 이메일 발송

#### `GET /api/alerts/monitoring/status`
모니터링 서비스 상태 확인

## 🎯 위험 키워드 분류

### 범죄 관련 (Crime)
```
'murder', 'killing', 'homicide', 'assassination', 'manslaughter',
'robbery', 'burglary', 'theft', 'kidnapping', 'abduction',
'rape', 'assault', 'attack', 'shooting', 'stabbing',
'terrorism', 'terrorist', 'bomb', 'explosion', 'blast',
'violence', 'violent crime', 'gang', 'drug trafficking',
'serial killer', 'mass shooting', 'armed robbery'
```

### 자연재해 (Natural Disaster)
```
'earthquake', 'tsunami', 'hurricane', 'typhoon', 'tornado',
'flood', 'flooding', 'wildfire', 'fire', 'volcanic eruption',
'landslide', 'avalanche', 'blizzard', 'drought', 'cyclone',
'storm', 'severe weather', 'natural disaster', 'emergency',
'evacuation', 'disaster zone'
```

### 공공안전 (Public Safety)
```
'riot', 'protest', 'clash', 'civil unrest', 'demonstration',
'lockdown', 'curfew', 'emergency alert', 'public safety',
'security threat', 'danger', 'warning', 'alert',
'hazardous', 'unsafe', 'incident', 'accident'
```

## 🔄 실시간 모니터링 프로세스

1. **백그라운드 서비스 시작**: 애플리케이션 시작 시 자동으로 모니터링 태스크 생성
2. **주기적 체크**: 5분마다 모든 활성 사용자 위치 체크
3. **뉴스 분석**: 최근 24시간 내 뉴스에서 위험 키워드 탐지
4. **거리 계산**: 하버사인 공식을 사용한 정확한 거리 계산
5. **알림 발송**: 위험 상황 감지 시 이메일 알림 자동 발송
6. **중복 방지**: 동일 사용자에게 최소 1시간 간격으로 알림

## 🛡️ 보안 기능

- JWT 토큰 기반 인증
- 비밀번호 해시화 (bcrypt)
- CORS 설정
- SQL Injection 방지 (SQLAlchemy ORM 사용)
- API 레이트 리미팅 (향후 구현 예정)

## 🌐 프론트엔드 페이지

### `/alert-settings`
- 위치 정보 관리
- 알림 설정 (활성화/비활성화, 반경 설정)
- 현재 위험 상황 확인
- 테스트 이메일 발송

### 주요 컴포넌트
- **위치 업데이트**: HTML5 Geolocation API 사용
- **실시간 설정**: 즉시 적용되는 알림 설정
- **위험 상황 시각화**: 위험도별 색상 코딩 및 아이콘

## 📧 이메일 알림 기능

### HTML 이메일 템플릿
- 반응형 디자인
- 위험도별 색상 구분
- 키워드 하이라이팅
- 뉴스 링크 제공
- 안전 수칙 안내

### 발송 조건
- 사용자 알림 활성화 상태
- 설정된 반경 내 위험 상황 발생
- 최소 1시간 간격 유지

## 🚦 상태 모니터링

### 서비스 상태 확인
- 모니터링 서비스 실행 상태
- 체크 주기 설정 상태
- 알림 간격 설정 상태

### 로그 시스템
- 모니터링 로그
- 이메일 발송 로그
- 오류 로그

## 🔮 향후 개발 예정 기능

1. **WebSocket 실시간 알림**: 브라우저 푸시 알림
2. **모바일 앱**: React Native 기반 모바일 애플리케이션
3. **지도 시각화**: 위험 지역 지도 표시
4. **알림 히스토리**: 과거 알림 내역 조회
5. **다국어 지원**: 한국어 뉴스 지원
6. **AI 기반 분석**: 머신러닝을 활용한 위험도 예측

## 🛠️ 트러블슈팅

### 일반적인 문제

#### 1. 이메일 발송 실패
- Gmail 앱 비밀번호 설정 확인
- SMTP 서버 연결 상태 확인
- 환경 변수 설정 확인

#### 2. 위치 정보 오류
- 브라우저 위치 권한 허용
- HTTPS 환경에서 테스트
- GPS 정확도 설정 확인

#### 3. 모니터링 서비스 오류
- 데이터베이스 연결 상태 확인
- MongoDB 뉴스 데이터 존재 여부 확인
- Google Maps API 키 유효성 확인

## 📞 지원

문제가 발생하거나 기능 개선 제안이 있으시면 개발팀에 문의해주세요.

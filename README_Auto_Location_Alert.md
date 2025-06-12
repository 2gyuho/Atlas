# 🔄 자동 위치 추적 기반 실시간 위험 알림 시스템

## 📋 시스템 개요

이 시스템은 사용자의 현재 위치를 자동으로 추적하여, 주변에서 발생하는 위험 상황(범죄, 자연재해, 테러 등)을 실시간으로 감지하고 이메일 알림을 자동으로 발송하는 GPS 기반 안전 알림 서비스입니다.

## 🔧 주요 기능

### 1. 자동 위치 추적
- **브라우저 Geolocation API** 활용
- **실시간 위치 모니터링** (5분 간격 또는 100m 이상 이동 시)
- **배터리 효율성 고려** (정확도 조절 가능)
- **권한 관리** (사용자 동의 기반)

### 2. 지능형 위험 감지
- **영어 뉴스 키워드 분석**
  - 범죄: murder, terrorism, robbery, assault 등
  - 자연재해: earthquake, tsunami, fire, flood 등
  - 공공안전: riot, emergency, evacuation 등
- **위험도 분류** (High/Medium/Low)
- **거리 기반 필터링** (사용자 설정 반경 내)

### 3. 실시간 알림 발송
- **네이버 SMTP** 이메일 알림
- **HTML 형식** 상세 위험 정보 제공
- **스팸 방지** (최소 1시간 간격)
- **다중 위험 상황 통합** 알림

## 🏗️ 시스템 아키텍처

```
[사용자 브라우저] → [위치 추적] → [백엔드 API] → [MongoDB 뉴스 분석]
                                      ↓
[이메일 발송] ← [위험 감지] ← [실시간 모니터링 서비스]
```

## 📱 프론트엔드 구성

### 위치 추적 서비스 (`locationTracker.js`)
```javascript
// 자동 위치 추적 시작
await locationTracker.startTracking(
  (position) => console.log('위치 업데이트:', position),
  (error) => console.error('추적 오류:', error)
);
```

### 주요 기능
- **권한 확인 및 요청**
- **연속 위치 추적** (watchPosition)
- **효율적 서버 업데이트** (조건부 전송)
- **오류 처리 및 복구**

## 🔙 백엔드 구성

### 1. 데이터베이스 모델
```python
class MySQLUser(Base):
    # 기존 필드...
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    alert_enabled = Column(Boolean, default=False)
    alert_radius_km = Column(Integer, default=50)
    auto_location_tracking = Column(Boolean, default=False)  # 새 필드
    location_update_frequency = Column(Integer, default=300)  # 새 필드
```

### 2. 핵심 서비스

#### AlertService (`alert_service.py`)
- 뉴스 데이터에서 위험 키워드 감지
- 지리적 거리 계산 (하버사인 공식)
- 위험도 분석 및 분류

#### MonitoringService (`monitoring_service.py`)
- 백그라운드 실시간 모니터링
- 사용자별 위험 상황 체크
- 알림 발송 관리

#### EmailService (`email_service.py`)
- 네이버 SMTP 연동
- HTML 이메일 템플릿
- 연결 테스트 기능

## 🚀 설치 및 설정

### 1. 백엔드 설정
```bash
cd backend
pip install -r requirements.txt
```

### 2. 환경 변수 설정 (`.env`)
```env
# 네이버 이메일 설정
SMTP_SERVER=smtp.naver.com
SMTP_PORT=587
EMAIL_USER=your_email@naver.com
EMAIL_PASSWORD=your_naver_password

# 데이터베이스 설정
MYSQL_HOST=your_mysql_host
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=atlas

# MongoDB 설정
MONGODB_URL=mongodb://username:password@host/
DATABASE_NAME=your_database_name
```

### 3. 데이터베이스 초기화
```bash
python scripts/update_user_table.py
python scripts/simple_add_columns.py
```

### 4. 서버 실행
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 프론트엔드 실행
```bash
cd frontend
npm install
npm start
```

## 🎯 사용법

### 1. 사용자 등록 및 로그인
1. 회원가입 후 로그인
2. **위험 알림** 메뉴 접속

### 2. 자동 위치 추적 활성화
1. **"자동 위치 추적"** 체크박스 활성화
2. 브라우저 위치 권한 허용
3. 시스템이 자동으로 위치 추적 시작

### 3. 알림 설정
- **알림 활성화**: 위험 상황 알림 수신 여부
- **알림 반경**: 50km (기본값, 조정 가능)
- **자동 추적**: 수동/자동 위치 업데이트 선택

## 📊 API 엔드포인트

### 위치 관리
- `PUT /api/alerts/location` - 위치 업데이트
- `GET /api/alerts/settings` - 알림 설정 조회
- `PUT /api/alerts/settings` - 알림 설정 변경

### 위험 상황 확인
- `GET /api/alerts/check` - 현재 위험 상황 즉시 확인
- `GET /api/alerts/nearby-dangers` - 주변 위험 상황 목록

### 테스트 기능
- `POST /api/alerts/test-email` - 테스트 이메일 발송
- `GET /api/alerts/test-smtp` - SMTP 연결 테스트

## 🔒 보안 및 개인정보

### 위치 정보 보호
- **사용자 동의** 기반 위치 수집
- **최소한의 정보** 저장 (위경도만)
- **암호화된 통신** (HTTPS)
- **위치 기록 비저장** (현재 위치만 유지)

### 데이터 정책
- 위치 정보는 안전 알림 목적으로만 사용
- 사용자가 언제든지 추적 중지 가능
- 계정 삭제 시 모든 위치 정보 삭제

## 🚨 위험 키워드 목록

### 범죄 관련
```python
'crime': [
    'murder', 'killing', 'homicide', 'assassination',
    'robbery', 'burglary', 'theft', 'kidnapping',
    'rape', 'assault', 'attack', 'shooting',
    'terrorism', 'terrorist', 'bomb', 'explosion'
]
```

### 자연재해
```python
'natural_disaster': [
    'earthquake', 'tsunami', 'hurricane', 'typhoon',
    'flood', 'wildfire', 'volcanic eruption',
    'landslide', 'avalanche', 'blizzard'
]
```

### 공공안전
```python
'public_safety': [
    'riot', 'protest', 'civil unrest',
    'lockdown', 'curfew', 'emergency alert',
    'evacuation', 'disaster zone'
]
```

## 🔧 고급 설정

### 위치 추적 빈도 조절
```javascript
// 위치 업데이트 조건
- 시간: 5분 간격
- 거리: 100m 이상 이동
- 배터리 절약: 낮은 정확도 모드
```

### 모니터링 주기 설정
```python
class MonitoringService:
    check_interval = 300  # 5분마다 사용자 체크
    min_alert_interval = 3600  # 최소 1시간 알림 간격
```

## 📈 성능 최적화

### 클라이언트 최적화
- **조건부 서버 전송** (위치 변화 시만)
- **캐시 활용** (1분 캐시)
- **배터리 효율성** 고려

### 서버 최적화
- **비동기 처리** (FastAPI)
- **데이터베이스 인덱싱**
- **스팸 방지** 로직

## 🛠️ 문제 해결

### 위치 추적 문제
1. **권한 거부**: 브라우저 설정에서 위치 권한 허용
2. **GPS 비활성화**: 기기의 위치 서비스 활성화
3. **실내 정확도 낮음**: 정상적인 현상

### 이메일 알림 문제
1. **네이버 SMTP 오류**: POP3/IMAP 설정 확인
2. **인증 실패**: 이메일/비밀번호 재확인
3. **스팸 처리**: 메일함 스팸폴더 확인

### 알림 미수신 문제
1. **알림 설정 확인**: alert_enabled 체크
2. **위치 정보 확인**: 현재 위치 등록 여부
3. **서버 상태 확인**: 모니터링 서비스 실행 상태

## 📞 지원 및 문의

- **기술 문서**: `/docs/naver_smtp_setup.md`
- **API 문서**: `http://localhost:8000/docs`
- **테스트 도구**: `python scripts/test_alert_system.py`

---

이 시스템을 통해 사용자는 별도의 조작 없이도 자동으로 주변 위험 상황을 실시간으로 알림받을 수 있어, 개인 안전을 크게 향상시킬 수 있습니다.

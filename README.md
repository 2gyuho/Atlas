# Atlas

<div align="center">

![License](https://img.shields.io/badge/License-MIT-yellow)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)

</div>

## 프로젝트 정리

해외여행자를 위한 위치 기반 안전 알림 서비스다. 사용자의 여행 일정과 현재 위치를 바탕으로 위험 상황을 주기적으로 모니터링하고, 이메일 및 웹 알림으로 안전 정보를 전달한다. 국가별 대사관 연락처, 여행지 뉴스, 날씨 정보를 함께 제공해 여행 중 필요한 정보를 한 곳에서 확인할 수 있도록 한다.

## 프로젝트 특징

- 여행 일정 등록 및 관리 (국가, 도시, 기간, 경유지, 준비물)
- 위치 기반 실시간 위험 모니터링 및 이메일/웹 알림 발송
- 국가별 대사관 연락처 조회
- 여행지 관련 뉴스 및 안전 정보 제공
- JWT 기반 사용자 인증 및 관리자 전용 알림 발송 대시보드
- 여행지 날씨 정보 조회

## 기술 스택

**Backend**: FastAPI, MongoDB(Motor), MySQL(SQLAlchemy, asyncmy), python-jose(JWT), aiosmtplib

**Frontend**: React, React Router, Axios, Framer Motion

## 설치

```
git clone https://github.com/2gyuho/Atlas.git
cd Atlas
```

```
cd backend
pip install -r requirements.txt
cp .env.example .env
```

```
cd frontend
npm install
```

## 실행

```
cd backend
uvicorn app.main:app --reload
```

```
cd frontend
npm start
```

## 라이선스

MIT

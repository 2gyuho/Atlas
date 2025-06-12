# 네이버 SMTP 설정 가이드

## 📧 네이버 메일 SMTP 설정 방법

### 1. 네이버 메일 SMTP 설정 정보
- **SMTP 서버**: smtp.naver.com
- **포트**: 587 (STARTTLS) 또는 465 (SSL)
- **보안**: STARTTLS 또는 SSL/TLS
- **인증**: 필요

### 2. 네이버 메일 설정 단계

#### 2.1 네이버 메일 로그인
1. [네이버 메일](https://mail.naver.com) 로그인
2. 우측 상단 설정(톱니바퀴) 클릭

#### 2.2 POP3/IMAP 설정 활성화
1. **환경설정** → **POP3/IMAP 설정** 메뉴 선택
2. **POP3/IMAP 사용** 체크박스 활성화
3. **IMAP/SMTP 사용** 활성화
4. **확인** 버튼 클릭

#### 2.3 외부 메일 클라이언트 허용
1. **환경설정** → **보안설정** 메뉴 선택
2. **외부 메일 클라이언트에서 네이버 메일 사용** 활성화
3. 필요시 **2차 인증** 설정

### 3. 환경변수 설정

`.env` 파일에 다음과 같이 설정하세요:

```env
# 네이버 이메일 설정
SMTP_SERVER=smtp.naver.com
SMTP_PORT=587
EMAIL_USER=your_naver_id@naver.com
EMAIL_PASSWORD=your_naver_password
```

### 4. 보안 참고사항

#### 4.1 일반 비밀번호 사용
- 네이버는 Gmail과 달리 앱 비밀번호가 아닌 일반 로그인 비밀번호를 사용합니다.
- 단, 2차 인증이 활성화된 경우 앱 비밀번호가 필요할 수 있습니다.

#### 4.2 2차 인증 설정 시
1. **네이버 내정보** → **보안설정** → **2단계 인증**
2. 2차 인증 활성화 후 **앱 비밀번호** 생성
3. 생성된 앱 비밀번호를 `EMAIL_PASSWORD`에 사용

### 5. 테스트 방법

```bash
# 백엔드 디렉토리에서 테스트 실행
cd backend
python scripts/test_alert_system.py
```

### 6. 문제 해결

#### 6.1 인증 실패 시
- 네이버 메일 로그인 정보 확인
- POP3/IMAP 설정이 활성화되어 있는지 확인
- 외부 메일 클라이언트 허용 설정 확인

#### 6.2 연결 실패 시
- 방화벽에서 587 포트가 열려있는지 확인
- 안티바이러스가 SMTP 연결을 차단하지 않는지 확인

#### 6.3 "인증되지 않은 발송자" 오류 시
- 네이버 메일 설정에서 "외부 메일 클라이언트 사용" 활성화
- 스팸 차단 설정 확인

### 7. 다른 메일 서비스 SMTP 설정

#### Gmail
```env
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password  # 앱 비밀번호 필요
```

#### Daum/Kakao
```env
SMTP_SERVER=smtp.daum.net
SMTP_PORT=587
EMAIL_USER=your_email@daum.net
EMAIL_PASSWORD=your_daum_password
```

#### Outlook/Hotmail
```env
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_outlook_password
```

### 8. 보안 권장사항

1. **환경변수 사용**: 비밀번호를 코드에 직접 입력하지 마세요
2. **2차 인증 활성화**: 가능한 경우 2차 인증을 사용하세요
3. **앱 비밀번호**: 2차 인증 시 앱 비밀번호를 생성하세요
4. **정기적 변경**: 비밀번호를 정기적으로 변경하세요

---

💡 **팁**: 네이버 메일은 하루 발송 제한이 있을 수 있습니다. 대량 발송이 필요한 경우 전문 이메일 서비스(SendGrid, Mailgun 등) 사용을 권장합니다.

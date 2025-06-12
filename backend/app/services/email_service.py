import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Any
import os
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = getattr(settings, 'smtp_server', 'smtp.naver.com')
        self.smtp_port = getattr(settings, 'smtp_port', 587)
        self.email_user = getattr(settings, 'email_user', '')
        self.email_password = getattr(settings, 'email_password', '')
        
    async def send_alert_email(self, user_email: str, dangerous_news: List[Dict[str, Any]], user_location: str = "Unknown"):
        """위험 알림 이메일 발송"""
        try:
            if not self.email_user or not self.email_password:
                logger.warning("이메일 설정이 없어 이메일을 발송할 수 없습니다.")
                logger.info("네이버 SMTP 설정 방법은 docs/naver_smtp_setup.md를 참조하세요.")
                return False
            
            # 비동기적으로 이메일 발송을 실행
            loop = asyncio.get_event_loop()
            success = await loop.run_in_executor(None, self._send_email_sync, user_email, dangerous_news, user_location)
            return success
            
        except Exception as e:
            logger.error(f"이메일 발송 실패: {e}")
            return False
    
    def _send_email_sync(self, user_email: str, dangerous_news: List[Dict[str, Any]], user_location: str):
        """동기 방식으로 이메일 발송"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = user_email
            msg['Subject'] = "🚨 위험 알림: 주변 지역 위험 상황 발생"
            
            # HTML 이메일 본문 생성
            html_body = self._create_alert_email_body(dangerous_news, user_location)
            msg.attach(MIMEText(html_body, 'html'))
            
            # SMTP 서버 연결 및 이메일 발송
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            server.send_message(msg)
            server.quit()
            
            logger.info(f"알림 이메일 발송 완료: {user_email}")
            return True
        except Exception as e:
            logger.error(f"동기 이메일 발송 실패: {e}")
            return False
    
    async def test_smtp_connection(self):
        """SMTP 연결 테스트"""
        try:
            if not self.email_user or not self.email_password:
                return {
                    "success": False,
                    "message": "이메일 설정이 없습니다. .env 파일에 EMAIL_USER와 EMAIL_PASSWORD를 설정하세요."
                }
            
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, self._test_smtp_connection_sync)
            return result
            
        except Exception as e:
            return {
                "success": False,
                "message": f"SMTP 연결 테스트 실패: {str(e)}"
            }
    
    def _test_smtp_connection_sync(self):
        """동기 방식으로 SMTP 연결 테스트"""
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            server.quit()
            
            return {
                "success": True,
                "message": f"네이버 SMTP 연결 성공! ({self.email_user})"
            }
            
        except smtplib.SMTPAuthenticationError:
            return {
                "success": False,
                "message": "인증 실패: 네이버 메일 로그인 정보를 확인하고, POP3/IMAP 설정을 활성화하세요."
            }
        except smtplib.SMTPConnectError:
            return {
                "success": False,
                "message": "연결 실패: 네트워크 연결 또는 방화벽 설정을 확인하세요."
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"SMTP 연결 오류: {str(e)}"
            }
    
    def _create_alert_email_body(self, dangerous_news: List[Dict[str, Any]], user_location: str) -> str:
        """알림 이메일 HTML 본문 생성"""
        severity_colors = {
            'high': '#dc3545',    # 빨간색
            'medium': '#fd7e14',  # 주황색
            'low': '#ffc107'      # 노란색
        }
        
        severity_icons = {
            'high': '🔴',
            'medium': '🟠', 
            'low': '🟡'
        }
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background-color: #dc3545; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; }}
                .content {{ padding: 20px; }}
                .news-item {{ border: 1px solid #ddd; border-radius: 8px; margin: 15px 0; padding: 15px; }}
                .severity-high {{ border-left: 5px solid #dc3545; }}
                .severity-medium {{ border-left: 5px solid #fd7e14; }}
                .severity-low {{ border-left: 5px solid #ffc107; }}
                .news-title {{ font-weight: bold; font-size: 16px; margin-bottom: 10px; }}
                .news-meta {{ color: #666; font-size: 12px; margin-bottom: 10px; }}
                .danger-info {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }}
                .keywords {{ display: inline-block; background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; margin: 2px; font-size: 11px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 위험 알림</h1>
                    <p>현재 위치: {user_location}</p>
                </div>
                <div class="content">
                    <p><strong>주변 지역에서 위험 상황이 감지되었습니다.</strong></p>
                    <p>총 <strong>{len(dangerous_news)}건</strong>의 위험 상황이 발생했습니다:</p>
        """
        for news in dangerous_news:
            danger_info = news.get('danger_info', {})
            severity = danger_info.get('severity', 'low')
            categories = danger_info.get('categories', [])
            # matched_keywords와 keywords_found 모두 확인
            keywords = (danger_info.get('matched_keywords', []) or 
                       danger_info.get('keywords_found', []))
            
            html += f"""
                    <div class="news-item severity-{severity}">
                        <div class="news-title">
                            {severity_icons.get(severity, '⚠️')} {news.get('title', 'No Title')}
                        </div>
                        <div class="news-meta">
                            출처: {news.get('source', 'Unknown')} | 
                            날짜: {news.get('published', news.get('date', 'Unknown'))}
                        </div>
                        <div class="danger-info">
                            <strong>위험도:</strong> <span style="color: {severity_colors.get(severity, '#666')}">{severity.upper()}</span><br>
                            <strong>카테고리:</strong> {', '.join(categories)}<br>
                            <strong>감지된 키워드:</strong> 
                            {' '.join([f'<span class="keywords">{kw}</span>' for kw in keywords[:5]])}
                        </div>
                        {f'<p><a href="{news.get("url", "#")}" target="_blank">뉴스 전문 보기</a></p>' if news.get('url') else ''}
                    </div>
            """
        
        html += """
                    <div style="margin-top: 30px; padding: 15px; background-color: #fff3cd; border-radius: 5px;">
                        <h3>⚠️ 안전 수칙</h3>
                        <ul>
                            <li>주변 상황을 주의 깊게 살피세요</li>
                            <li>불필요한 외출을 자제하세요</li>
                            <li>긴급상황 시 119, 112에 신고하세요</li>
                            <li>가족과 지인에게 안전 여부를 알리세요</li>
                        </ul>
                    </div>
                </div>
                <div class="footer">
                    <p>이 알림은 자동으로 발송되었습니다.</p>
                    <p>알림 설정을 변경하려면 앱에서 설정 메뉴를 확인하세요.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html

    async def send_email(self, to_email: str, subject: str, content: str):
        """간단한 이메일 발송"""
        try:
            if not self.email_user or not self.email_password:
                logger.warning("이메일 설정이 없어 이메일을 발송할 수 없습니다.")
                return False
            
            # 비동기적으로 이메일 발송을 실행
            loop = asyncio.get_event_loop()
            success = await loop.run_in_executor(None, self._send_simple_email_sync, to_email, subject, content)
            return success
            
        except Exception as e:
            logger.error(f"이메일 발송 실패: {e}")
            return False
    
    def _send_simple_email_sync(self, to_email: str, subject: str, content: str):
        """동기 방식으로 간단한 이메일 발송"""
        try:
            msg = MIMEMultipart()
            msg['From'] = self.email_user
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # 텍스트 본문 추가
            msg.attach(MIMEText(content, 'plain', 'utf-8'))
            
            # SMTP 서버 연결 및 이메일 발송
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.email_user, self.email_password)
            
            text = msg.as_string()
            server.sendmail(self.email_user, to_email, text)
            server.quit()
            
            logger.info(f"이메일이 성공적으로 발송되었습니다: {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"이메일 발송 실패 ({to_email}): {e}")
            return False


# 싱글톤 인스턴스
email_service = EmailService()

// 브라우저 콘솔에서 실행할 테스트 코드
// 현재 페이지: http://localhost:3000

console.log("=== 프론트엔드 알림 시스템 테스트 ===");

// 1. 로컬 스토리지에서 토큰 확인
const token = localStorage.getItem('token');
console.log("토큰 존재:", !!token);

if (token) {
    // 2. 읽지 않은 알림 개수 확인
    fetch('http://localhost:8000/api/notifications/unread-count', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("읽지 않은 알림 개수:", data);
    })
    .catch(error => {
        console.error("읽지 않은 알림 개수 조회 실패:", error);
    });

    // 3. 알림 목록 조회
    fetch('http://localhost:8000/api/notifications', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("알림 목록:", data);
        console.log(`총 ${data.length}개의 알림이 있습니다.`);
    })
    .catch(error => {
        console.error("알림 목록 조회 실패:", error);
    });

    // 4. 테스트 알림 생성
    fetch('http://localhost:8000/api/notifications/test', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log("테스트 알림 생성 결과:", data);
    })
    .catch(error => {
        console.error("테스트 알림 생성 실패:", error);
    });
} else {
    console.log("로그인이 필요합니다. 먼저 로그인 해주세요.");
}

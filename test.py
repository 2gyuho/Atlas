import mysql.connector
from pymongo import MongoClient

# MySQL 연결 설정
mysql_conn = mysql.connector.connect(
    host='devine.my',
    user='root',
    password='***REMOVED***',
    database='test'   # 실제 사용할 DB명으로 변경
)
print('MySQL 연결 완료:', mysql_conn.is_connected())

# MongoDB 연결 설정
mongo_client = MongoClient('mongodb://2gyuho:***REMOVED***@devine.my/')
mongo_db = mongo_client['test']  # 실제 사용할 DB명으로 변경
print('MongoDB 연결 완료:', mongo_db.name)

# 예시: MySQL에서 데이터 가져오기
mysql_cursor = mysql_conn.cursor()
mysql_cursor.execute("SHOW DATABASES")
print('MySQL DB 목록:', [db[0] for db in mysql_cursor.fetchall()])

# 예시: MongoDB에서 컬렉션 목록 확인
print('MongoDB 컬렉션 목록:', mongo_db.list_collection_names())

# 자원 정리
mysql_cursor.close()
mysql_conn.close()
mongo_client.close()

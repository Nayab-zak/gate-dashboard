# server/app/db.py
from contextlib import contextmanager
import vertica_python
from backend.config import settings

conn_info = {
    "host": settings.VERTICA_HOST,
    "port": settings.VERTICA_PORT,
    "user": settings.VERTICA_USER,
    "password": settings.VERTICA_PASSWORD,
    "database": settings.VERTICA_DB,
    "autocommit": True,
    "use_prepared_statements": True,
}

@contextmanager
def get_conn():
    conn = vertica_python.connect(**conn_info)
    try:
        yield conn
    finally:
        conn.close()

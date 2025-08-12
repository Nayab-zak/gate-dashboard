# server/app/config.py
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()  # loads from nearest .env

class Settings(BaseModel):
    VERTICA_HOST: str = os.getenv("VERTICA_HOST", "localhost")
    VERTICA_PORT: int = int(os.getenv("VERTICA_PORT", "5433"))
    VERTICA_DB: str = os.getenv("VERTICA_DB", "VMart")
    VERTICA_USER: str = os.getenv("VERTICA_USER", "dbadmin")
    VERTICA_PASSWORD: str = os.getenv("VERTICA_PASSWORD", "")
    VERTICA_TABLE_TOKENS: str = os.getenv("VERTICA_TABLE_TOKENS", "DPW_DL.TBL_GATE_TOKENS")
    DROP_COL_NAME: str = os.getenv("DROP_COL_NAME", "ContainerCount")
    # defaults for UI/ops
    DEFAULT_TIMEZONE: str = "Asia/Dubai"
    DEFAULT_CAPACITY_PER_HOUR: int = 60  # editable via capacity endpoint

settings = Settings()
# Expose settings as a global variable
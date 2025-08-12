from datetime import datetime, timedelta, timezone
import zoneinfo

TZ = zoneinfo.ZoneInfo("Asia/Dubai")

def now_local():
    return datetime.now(tz=TZ)

def next_n_hours(n: int):
    start = now_local().replace(minute=0, second=0, microsecond=0)
    return [start + timedelta(hours=i) for i in range(n)]

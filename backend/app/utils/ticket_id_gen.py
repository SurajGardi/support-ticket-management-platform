import uuid
from datetime import datetime

def generate_ticket_id() -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    short_id = uuid.uuid4().hex[:6].upper()
    return f"TKT-{date_str}-{short_id}"

def generate_id() -> str:
    return str(uuid.uuid4())
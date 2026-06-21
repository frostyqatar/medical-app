import traceback

try:
    from .server.main import app
except Exception as e:
    print(f"IMPORT FAILED: {e}")
    traceback.print_exc()
    raise

import time
import re
import os

def sanitize_filename(filename):
    """
    Sanitize a filename by removing or replacing unsafe characters.
    """
    if not filename:
        return f"file_{int(time.time())}"
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = re.sub(r'\.+', '.', filename)
    filename = filename.strip('. ')
    if not filename or filename in ['.', '..']:
        filename = f"file_{int(time.time())}"
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:250] + ext
    return filename 
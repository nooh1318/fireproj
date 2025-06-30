import os
import time
import hmac
import hashlib

class SlackVerifier:
    def __init__(self):
        self.signing_secret = os.environ['SLACK_SIGNING_SECRET']

    def verify_signature(self, headers, body):
        print("🔐 Verifying Slack signature...")
        slack_signature = headers.get('x-slack-signature', '')
        slack_timestamp = headers.get('x-slack-request-timestamp', '')

        if not slack_signature or not slack_timestamp:
            print("❌ Missing Slack headers.")
            return False

        if abs(time.time() - int(slack_timestamp)) > 60 * 5:
            print("⏱️ Request timestamp too old.")
            return False

        sig_basestring = f"v0:{slack_timestamp}:{body}".encode('utf-8')
        my_signature = 'v0=' + hmac.new(
            self.signing_secret.encode('utf-8'),
            sig_basestring,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(my_signature, slack_signature):
            print("❌ Signature mismatch.")
            return False

        print("✅ Slack signature verified.")
        return True 
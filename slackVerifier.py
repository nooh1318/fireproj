import hmac
import hashlib
import os
import time

class SlackVerifier:
    def __init__(self):
        self.signing_secret = os.environ.get('SLACK_SIGNING_SECRET', '')

    def verify_signature(self, headers, raw_body):
        """
        Verify Slack request signature
        """
        try:
            # Get timestamp and signature from headers
            timestamp = headers.get('x-slack-request-timestamp', '')
            signature = headers.get('x-slack-signature', '')
            
            if not timestamp or not signature:
                print("❌ Missing Slack signature headers")
                return False
            
            # Check if request is too old (replay attack protection)
            current_time = int(time.time())
            if abs(current_time - int(timestamp)) > 60 * 5:  # 5 minutes
                print("❌ Request timestamp too old")
                return False
            
            # Create the signature base string
            sig_basestring = f"v0:{timestamp}:{raw_body}"
            
            # Create the expected signature
            expected_signature = 'v0=' + hmac.new(
                self.signing_secret.encode('utf-8'),
                sig_basestring.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            # Compare signatures
            if hmac.compare_digest(expected_signature, signature):
                print("✅ Slack signature verified successfully")
                return True
            else:
                print("❌ Slack signature verification failed")
                return False
                
        except Exception as e:
            print(f"❌ Error verifying Slack signature: {str(e)}")
            return False 
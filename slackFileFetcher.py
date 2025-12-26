import json
import urllib.request
import urllib.error
import os
from utils import sanitize_filename

class SlackFileFetcher:
    def __init__(self, bot_token):
        self.bot_token = bot_token
        
    def test_bot_token(self):
        """
        Test if the bot token is valid and has necessary permissions
        """
        try:
            print("🔍 Testing bot token permissions...")
            
            # Test with auth.test endpoint
            api_url = "https://slack.com/api/auth.test"
            
            req = urllib.request.Request(
                api_url,
                headers={
                    'Authorization': f'Bearer {self.bot_token}',
                    'Content-Type': 'application/json'
                }
            )
            
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                print(f"📡 Auth test response: {data}")
                
                if data.get("ok"):
                    print(f"✅ Bot token is valid")
                    print(f"📋 Bot info: {data.get('user_id')} in team {data.get('team_id')}")
                    return True
                else:
                    print(f"❌ Bot token test failed: {data}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error testing bot token: {str(e)}")
            return False
    
    def fetch_file_info(self, file_id):
        """
        Fetch file information from Slack API
        """
        try:
            print(f"🔍 Fetching file info from Slack API for file_id: {file_id}")
            api_url = f"https://slack.com/api/files.info?file={file_id}"
            
            # Debug: Check if bot token is available
            if not self.bot_token:
                print("❌ Bot token is not set")
                return None
                
            print(f"🔐 Using bot token: {self.bot_token[:10]}...")
            
            req = urllib.request.Request(
                api_url,
                headers={"Authorization": f"Bearer {self.bot_token}"}
            )
            
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode())
                print(f"📡 Slack API response: {data}")
                
                if data.get("ok") and "file" in data:
                    file_info = data["file"]
                    print(f"✅ Successfully fetched file info: {file_info.get('name', 'unknown')}")
                    return file_info
                else:
                    print(f"❌ Failed to fetch file info from Slack: {data}")
                    return None
        except Exception as e:
            print(f"❌ Exception while fetching file info from Slack: {str(e)}")
            return None
    
    def download_file_content_fallback(self, file_id):
        """
        Fallback method to download file using files.download API
        """
        try:
            print(f"🔄 Trying fallback download method for file_id: {file_id}")
            
            api_url = f"https://slack.com/api/files.download?file={file_id}"
            
            req = urllib.request.Request(
                api_url,
                headers={
                    'Authorization': f'Bearer {self.bot_token}',
                    'User-Agent': 'SlackBot'
                }
            )
            
            with urllib.request.urlopen(req) as response:
                file_content = response.read()
                content_type = response.headers.get('content-type', 'application/octet-stream')
                
                print(f"✅ Fallback download successful. Size: {len(file_content)} bytes, Type: {content_type}")
                
                # Check if we got HTML instead of the actual file
                if 'text/html' in content_type or file_content.startswith(b'<!DOCTYPE') or file_content.startswith(b'<html'):
                    print("❌ Fallback also received HTML - authentication issue")
                    return None
                
                return {
                    'content': file_content,
                    'content_type': content_type,
                    'size': len(file_content)
                }
                
        except Exception as e:
            print(f"❌ Fallback download failed: {str(e)}")
            return None
    
    def download_file_content(self, url_private):
        """
        Download file content from Slack using url_private
        """
        try:
            print(f"🌐 Downloading file from Slack URL: {url_private}")
            
            # Debug: Check if bot token is available
            if not self.bot_token:
                print("❌ Bot token is not set for file download")
                return None
                
            print(f"🔐 Using bot token: {self.bot_token[:10]}... for download")
            
            req = urllib.request.Request(
                url_private,
                headers={
                    'Authorization': f'Bearer {self.bot_token}',
                    'User-Agent': 'SlackBot'
                }
            )
            
            with urllib.request.urlopen(req) as response:
                file_content = response.read()
                content_type = response.headers.get('content-type', 'application/octet-stream')
                
                print(f"✅ File downloaded successfully. Size: {len(file_content)} bytes, Type: {content_type}")
                
                # Check if we got HTML instead of the actual file
                if 'text/html' in content_type or file_content.startswith(b'<!DOCTYPE') or file_content.startswith(b'<html'):
                    print("❌ Received HTML instead of file content - likely authentication error")
                    print(f"🔍 First 500 bytes: {file_content[:500]}")
                    print(f"🔍 Full HTML content: {file_content.decode('utf-8', errors='ignore')}")
                    return None
                
                # Check if content is too small (likely an error page)
                if len(file_content) < 100:
                    print("❌ File content too small - likely an error response")
                    print(f"🔍 Content: {file_content}")
                    return None
                
                return {
                    'content': file_content,
                    'content_type': content_type,
                    'size': len(file_content)
                }
                
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP Error downloading file: {e.code} - {e.reason}")
            print(f"🔍 Response headers: {e.headers}")
            # Try to read the error response
            try:
                error_content = e.read()
                print(f"🔍 Error response content: {error_content[:500]}")
            except:
                pass
            return None
        except urllib.error.URLError as e:
            print(f"❌ URL Error downloading file: {str(e)}")
            return None
        except Exception as e:
            print(f"❌ Exception downloading file: {str(e)}")
            import traceback
            print(f"🔍 Full traceback: {traceback.format_exc()}")
            return None
    
    def get_filename_from_url(self, url_private, file_id, original_filename=None):
        """
        Extract filename from URL or use provided filename
        """
        if original_filename:
            return sanitize_filename(original_filename)
        
        # Try to extract from URL
        try:
            filename = url_private.split('/')[-1]
            if filename and '.' in filename:
                return sanitize_filename(filename)
        except:
            pass
        
        # Fallback to file_id
        return f"file_{file_id}"
    
    def fetch_and_prepare_file(self, file_id, url_private=None, original_filename=None):
        """
        Complete file fetching process - get info, download content, and prepare for upload
        """
        print(f"📁 Starting file fetch process for file_id: {file_id}")
        
        # Test bot token first
        if not self.test_bot_token():
            print("❌ Bot token validation failed - cannot proceed with file download")
            return None
        
        # If no url_private provided, try to get it from Slack API
        if not url_private:
            file_info = self.fetch_file_info(file_id)
            if file_info:
                url_private = file_info.get("url_private", "")
                if not original_filename:
                    original_filename = file_info.get("name", "")
                print(f"📋 Retrieved file info: name={original_filename}, size={file_info.get('size', 'unknown')}")
        
        # Try primary download method first
        download_result = None
        if url_private:
            download_result = self.download_file_content(url_private)
        
        # If primary method failed or returned HTML, try fallback
        if not download_result:
            print("🔄 Primary download failed, trying fallback method...")
            download_result = self.download_file_content_fallback(file_id)
        
        if not download_result:
            print(f"❌ Failed to download file content for file_id: {file_id}")
            return None
        
        # Generate filename
        filename = self.get_filename_from_url(url_private, file_id, original_filename)
        
        return {
            'file_id': file_id,
            'filename': filename,
            'content': download_result['content'],
            'content_type': download_result['content_type'],
            'size': download_result['size'],
            'url_private': url_private
        } 
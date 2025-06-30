import json
import urllib.request
import urllib.error
import os
from utils import sanitize_filename

class SlackFileFetcher:
    def __init__(self, bot_token):
        self.bot_token = bot_token
        
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
                return {
                    'content': file_content,
                    'content_type': content_type,
                    'size': len(file_content)
                }
                
        except urllib.error.HTTPError as e:
            print(f"❌ HTTP Error downloading file: {e.code} - {e.reason}")
            print(f"🔍 Response headers: {e.headers}")
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
        
        # If no url_private provided, try to get it from Slack API
        if not url_private:
            file_info = self.fetch_file_info(file_id)
            if file_info:
                url_private = file_info.get("url_private", "")
                if not original_filename:
                    original_filename = file_info.get("name", "")
                print(f"📋 Retrieved file info: name={original_filename}, size={file_info.get('size', 'unknown')}")
        
        if not url_private:
            print(f"❌ No url_private available for file_id: {file_id}")
            return None
        
        # Download file content
        download_result = self.download_file_content(url_private)
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
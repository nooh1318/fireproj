import boto3
import os
from datetime import datetime
from utils import sanitize_filename

class S3Uploader:
    def __init__(self, s3_client, bucket_name):
        self.s3_client = s3_client
        self.bucket_name = bucket_name
    
    def upload_file(self, file_data, user_id, channel_id, file_id):
        """
        Upload file to S3 with proper structure and metadata
        """
        try:
            filename = file_data.get('filename', f"file_{file_id}")
            content = file_data.get('content')
            content_type = file_data.get('content_type', 'application/octet-stream')
            
            if not content:
                print("❌ No file content provided for upload")
                return {
                    'success': False,
                    'error': 'No file content provided'
                }
            
            # Create S3 key with user/channel structure
            s3_key = f"{user_id}/{channel_id}/{filename}"
            
            # Prepare metadata
            metadata = {
                'file_id': file_id,
                'user_id': user_id,
                'channel_id': channel_id,
                'original_filename': filename,
                'upload_timestamp': datetime.utcnow().isoformat(),
                'content_type': content_type,
                'file_size': str(file_data.get('size', 0))
            }
            
            print(f"📤 Uploading file to S3: {s3_key}")
            print(f"📋 Metadata: {metadata}")
            print(f"📦 Content size: {len(content)} bytes")
            print(f"🔍 S3 Bucket: {self.bucket_name}")
            
            # Try to upload with public read access first
            try:
                response = self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=content,
                    ContentType=content_type,
                    Metadata=metadata,
                    ACL='public-read'  # Make file publicly accessible
                )
                print("✅ File uploaded with public-read ACL")
            except Exception as acl_error:
                print(f"⚠️ Public-read ACL failed, trying without ACL: {str(acl_error)}")
                # Fallback: upload without ACL
                response = self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=s3_key,
                    Body=content,
                    ContentType=content_type,
                    Metadata=metadata
                )
                print("✅ File uploaded without ACL (bucket policy will control access)")
            
            # Generate public URL
            public_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            print(f"✅ File uploaded successfully to S3")
            print(f"🔗 Public URL: {public_url}")
            print(f"📊 S3 Response: {response}")
            
            return {
                'success': True,
                's3_key': s3_key,
                'public_url': public_url,
                'etag': response.get('ETag', ''),
                'version_id': response.get('VersionId', ''),
                'metadata': metadata
            }
            
        except Exception as e:
            print(f"❌ Error uploading file to S3: {str(e)}")
            import traceback
            print(f"🔍 Full traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_file_with_retry(self, file_data, user_id, channel_id, file_id, max_retries=3):
        """
        Upload file with retry logic for resilience
        """
        for attempt in range(max_retries):
            try:
                result = self.upload_file(file_data, user_id, channel_id, file_id)
                if result['success']:
                    return result
                else:
                    print(f"⚠️ Upload attempt {attempt + 1} failed: {result.get('error', 'Unknown error')}")
            except Exception as e:
                print(f"⚠️ Upload attempt {attempt + 1} failed with exception: {str(e)}")
            
            if attempt < max_retries - 1:
                print(f"🔄 Retrying upload in 2 seconds... (attempt {attempt + 2}/{max_retries})")
                import time
                time.sleep(2)
        
        print(f"❌ All {max_retries} upload attempts failed")
        return {
            'success': False,
            'error': f'Failed after {max_retries} attempts'
        }
    
    def check_file_exists(self, s3_key):
        """
        Check if a file already exists in S3
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except:
            return False
    
    def get_file_url(self, s3_key):
        """
        Generate public URL for a file
        """
        return f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}" 
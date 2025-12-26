import json
import boto3
import urllib.request
import urllib.error
import os

def fetch_and_store_files_from_queue(sqs_client, s3_client, queue_url, bucket_name):
    """
    Fetch and process messages from SQS queue
    This function can be used for manual processing or as a backup to Lambda
    """
    print("🔄 Fetching messages from SQS queue...")
    print(f"🔍 Queue URL: {queue_url}")
    print(f"🔍 Bucket Name: {bucket_name}")
    
    try:
        print("📡 Attempting to receive messages from SQS...")
        response = sqs_client.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=5,  # Reduced from 20 to 5 seconds for testing
            VisibilityTimeout=600  # Increased from 300 to 600 seconds (10 minutes)
        )
        print("✅ SQS receive_message call completed successfully")
        
    except Exception as e:
        print(f"❌ Error calling SQS receive_message: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        return
    
    messages = response.get('Messages', [])
    print(f"📊 Response keys: {list(response.keys())}")
    print(f"📊 Messages found: {len(messages)}")
    
    if not messages:
        print("ℹ️ No messages in the queue.")
        return

    print(f"📥 Found {len(messages)} messages to process")

    for msg in messages:
        try:
            body = json.loads(msg['Body'])
            file_id = body.get('file_id')
            user_id = body.get('user_id', 'unknown_user')
            channel_id = body.get('channel_id', 'unknown_channel')
            url_private = body.get('url_private', '')
            
            print(f"📥 Processing file_id: {file_id} from user: {user_id} in channel: {channel_id}")
            
            success = False
            
            # Try to download from Slack URL if available
            if url_private:
                try:
                    print(f"🌐 Attempting to download file from Slack URL: {url_private}")
                    req = urllib.request.Request(
                        url_private,
                        headers={
                            'Authorization': f'Bearer {os.environ["SLACK_BOT_TOKEN"]}',
                            'User-Agent': 'SlackBot'
                        }
                    )
                    
                    with urllib.request.urlopen(req) as response:
                        file_content = response.read()
                        
                        # Generate a unique filename with timestamp
                        filename = url_private.split('/')[-1]
                        if not filename or '.' not in filename:
                            filename = f"file_{file_id}.txt"
                        
                        # Create S3 key with user/channel structure
                        s3_key = f"{user_id}/{channel_id}/{filename}"
                        
                        # Upload to S3
                        s3_client.put_object(
                            Bucket=bucket_name, 
                            Key=s3_key, 
                            Body=file_content,
                            ContentType=response.headers.get('content-type', 'application/octet-stream')
                        )
                        
                        print(f"✅ File uploaded to S3 as {s3_key}")
                        success = True
                        
                except Exception as e:
                    print(f"⚠️ Failed to download from Slack URL: {str(e)}")
                    # Will fall back to file_id logic if needed
            
            # Fall back to file_id logic if URL download failed
            if not success:
                try:
                    # If you have a source bucket with files, you can copy from there
                    source_bucket = 'source-bucket-name'  # TODO: Set your source bucket
                    s3_key = f"{user_id}/{channel_id}/{file_id}"
                    print(f"📦 Copying file from S3: {source_bucket}/{file_id} to {bucket_name}/{s3_key}")
                    
                    copy_source = {'Bucket': source_bucket, 'Key': file_id}
                    s3_client.copy_object(
                        CopySource=copy_source, 
                        Bucket=bucket_name, 
                        Key=s3_key
                    )
                    
                    print(f"✅ File copied to S3 as {s3_key}")
                    success = True
                    
                except Exception as e:
                    print(f"❌ Failed to copy file from source bucket: {str(e)}")
            
            if success:
                # Only delete the message if we successfully processed the file
                try:
                    sqs_client.delete_message(QueueUrl=queue_url, ReceiptHandle=msg['ReceiptHandle'])
                    print("🗑️ SQS message deleted after successful processing.")
                except Exception as e:
                    print(f"⚠️ Failed to delete SQS message: {str(e)}")
            else:
                print("⚠️ File processing failed, message will remain in queue.")

        except Exception as e:
            print(f"❌ Error processing SQS message: {str(e)}")
            # Message will automatically return to queue after visibility timeout

def fetch_continuously(sqs_client, s3_client, queue_url, bucket_name, max_iterations=10):
    """
    Continuously fetch messages from SQS queue until no more messages are found
    """
    print("🔄 Starting continuous message fetching...")
    
    for iteration in range(max_iterations):
        print(f"\n📋 Iteration {iteration + 1}/{max_iterations}")
        
        response = sqs_client.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=20,
            VisibilityTimeout=600
        )
        
        messages = response.get('Messages', [])
        if not messages:
            print("ℹ️ No more messages in queue. Stopping continuous fetch.")
            break
            
        print(f"📥 Found {len(messages)} messages in iteration {iteration + 1}")
        
        # Process the messages
        for msg in messages:
            try:
                body = json.loads(msg['Body'])
                file_id = body.get('file_id')
                user_id = body.get('user_id', 'unknown_user')
                channel_id = body.get('channel_id', 'unknown_channel')
                url_private = body.get('url_private', '')
                
                print(f"📥 Processing file_id: {file_id} from user: {user_id} in channel: {channel_id}")
                
                success = False
                
                # Try to download from Slack URL if available
                if url_private:
                    try:
                        print(f"🌐 Attempting to download file from Slack URL: {url_private}")
                        req = urllib.request.Request(
                            url_private,
                            headers={
                                'Authorization': f'Bearer {os.environ["SLACK_BOT_TOKEN"]}',
                                'User-Agent': 'SlackBot'
                            }
                        )
                        
                        with urllib.request.urlopen(req) as response:
                            file_content = response.read()
                            
                            # Generate a unique filename with timestamp
                            filename = url_private.split('/')[-1]
                            if not filename or '.' not in filename:
                                filename = f"file_{file_id}.txt"
                            
                            # Create S3 key with user/channel structure
                            s3_key = f"{user_id}/{channel_id}/{filename}"
                            
                            # Upload to S3
                            s3_client.put_object(
                                Bucket=bucket_name, 
                                Key=s3_key, 
                                Body=file_content,
                                ContentType=response.headers.get('content-type', 'application/octet-stream')
                            )
                            
                            print(f"✅ File uploaded to S3 as {s3_key}")
                            success = True
                            
                    except Exception as e:
                        print(f"⚠️ Failed to download from Slack URL: {str(e)}")
                
                # Fall back to file_id logic if URL download failed
                if not success:
                    try:
                        source_bucket = 'source-bucket-name'  # TODO: Set your source bucket
                        s3_key = f"{user_id}/{channel_id}/{file_id}"
                        print(f"📦 Copying file from S3: {source_bucket}/{file_id} to {bucket_name}/{s3_key}")
                        
                        copy_source = {'Bucket': source_bucket, 'Key': file_id}
                        s3_client.copy_object(
                            CopySource=copy_source, 
                            Bucket=bucket_name, 
                            Key=s3_key
                        )
                        
                        print(f"✅ File copied to S3 as {s3_key}")
                        success = True
                        
                    except Exception as e:
                        print(f"❌ Failed to copy file from source bucket: {str(e)}")
                
                if success:
                    # Only delete the message if we successfully processed the file
                    try:
                        sqs_client.delete_message(QueueUrl=queue_url, ReceiptHandle=msg['ReceiptHandle'])
                        print("🗑️ SQS message deleted after successful processing.")
                    except Exception as e:
                        print(f"⚠️ Failed to delete SQS message: {str(e)}")
                else:
                    print("⚠️ File processing failed, message will remain in queue.")

            except Exception as e:
                print(f"❌ Error processing SQS message: {str(e)}")
    
    print("✅ Continuous fetching completed.")

def main():
    """
    Main function to run the SQS file fetcher
    This can be used for manual processing or testing
    """
    print("🚀 Starting SQS File Fetcher...")
    
    # Check AWS credentials
    try:
        print("🔐 Checking AWS credentials...")
        sts_client = boto3.client('sts')
        identity = sts_client.get_caller_identity()
        print(f"✅ AWS credentials valid. Account: {identity['Account']}, User: {identity['Arn']}")
    except Exception as e:
        print(f"❌ AWS credentials error: {str(e)}")
        print("💡 Make sure you have AWS credentials configured (AWS CLI, environment variables, or IAM role)")
        return
    
    # Initialize AWS clients
    try:
        print("🔧 Initializing AWS clients...")
        sqs_client = boto3.client('sqs')
        s3_client = boto3.client('s3')
        print("✅ AWS clients initialized successfully")
    except Exception as e:
        print(f"❌ Error initializing AWS clients: {str(e)}")
        return
    
    # Get configuration from environment variables
    queue_url = os.environ.get('SQS_QUEUE_URL')
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    
    print(f"🔍 Environment variables:")
    print(f"   SQS_QUEUE_URL: {'✅ Set' if queue_url else '❌ Missing'}")
    print(f"   S3_BUCKET_NAME: {'✅ Set' if bucket_name else '❌ Missing'}")
    
    if not queue_url or not bucket_name:
        print("❌ Missing required environment variables: SQS_QUEUE_URL and S3_BUCKET_NAME")
        print("💡 Set these environment variables before running the script")
        return
    
    print(f"📋 Configuration:")
    print(f"   Queue URL: {queue_url}")
    print(f"   S3 Bucket: {bucket_name}")
    
    # Test SQS queue access
    try:
        print("🔍 Testing SQS queue access...")
        queue_attributes = sqs_client.get_queue_attributes(
            QueueUrl=queue_url,
            AttributeNames=['QueueArn', 'ApproximateNumberOfMessages']
        )
        print(f"✅ Queue accessible. Messages in queue: {queue_attributes['Attributes'].get('ApproximateNumberOfMessages', 'Unknown')}")
    except Exception as e:
        print(f"❌ Error accessing SQS queue: {str(e)}")
        return
    
    # Use continuous fetching to process all messages
    fetch_continuously(sqs_client, s3_client, queue_url, bucket_name, max_iterations=5)
    
    print("✅ SQS File Fetcher completed.")

if __name__ == "__main__":
    main() 
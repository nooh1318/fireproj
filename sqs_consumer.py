import json
import boto3
import os
from slackFileFetcher import SlackFileFetcher
from s3_uploader import S3Uploader
from dynamodb_writer import DynamoWriter

class SQSConsumer:
    def __init__(self, sqs_client, s3_client, dynamodb_table, queue_url, bucket_name, bot_token):
        self.sqs_client = sqs_client
        self.s3_client = s3_client
        self.dynamodb_table = dynamodb_table
        self.queue_url = queue_url
        self.bucket_name = bucket_name
        self.bot_token = bot_token
        
        # Initialize service classes
        self.slack_fetcher = SlackFileFetcher(bot_token)
        self.s3_uploader = S3Uploader(s3_client, bucket_name)
        self.dynamo_writer = DynamoWriter(dynamodb_table)
    
    def process_message(self, record):
        """
        Process a single SQS message record
        """
        try:
            print(f"🔍 Processing SQS record: {json.dumps(record, default=str)}")
            print(f"🔍 Record keys: {list(record.keys())}")
            
            # Handle both SQS record format and direct message format
            if 'body' in record:
                print("✅ Found 'body' field in record")
                body = json.loads(record['body'])
            elif 'Body' in record:
                print("✅ Found 'Body' field in record")
                body = json.loads(record['Body'])
            else:
                print(f"❌ No 'body' or 'Body' field found in SQS record")
                print(f"🔍 Available fields: {list(record.keys())}")
                raise ValueError("No 'body' or 'Body' field found in SQS record")
                
            print(f"📋 Parsed body: {body}")
            file_id = body.get('file_id')
            user_id = body.get('user_id', 'unknown_user')
            channel_id = body.get('channel_id', 'unknown_channel')
            url_private = body.get('url_private', '')
            
            print(f"📥 Processing file: {file_id} from user: {user_id} in channel: {channel_id}")
            print(f"🔗 URL Private: {url_private}")
            
            # Step 1: Fetch file from Slack
            file_data = self.slack_fetcher.fetch_and_prepare_file(
                file_id=file_id,
                url_private=url_private
            )
            
            if not file_data:
                print(f"❌ Failed to fetch file data for file_id: {file_id}")
                return {
                    'success': False,
                    'error': 'Failed to fetch file from Slack',
                    'file_id': file_id
                }
            
            # Step 2: Upload to S3
            upload_result = self.s3_uploader.upload_file_with_retry(
                file_data=file_data,
                user_id=user_id,
                channel_id=channel_id,
                file_id=file_id
            )
            
            if not upload_result['success']:
                print(f"❌ Failed to upload file to S3 for file_id: {file_id}")
                return {
                    'success': False,
                    'error': upload_result.get('error', 'Failed to upload to S3'),
                    'file_id': file_id
                }
            
            # Step 3: Update DynamoDB with S3 information
            self.update_dynamodb_with_s3_info(
                file_id=file_id,
                user_id=user_id,
                channel_id=channel_id,
                upload_result=upload_result,
                file_data=file_data
            )
            
            print(f"✅ Successfully processed file: {file_id}")
            return {
                'success': True,
                'file_id': file_id,
                's3_key': upload_result['s3_key'],
                'public_url': upload_result['public_url']
            }
            
        except Exception as e:
            print(f"❌ Error processing SQS message: {str(e)}")
            import traceback
            print(f"🔍 Full traceback: {traceback.format_exc()}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def update_dynamodb_with_s3_info(self, file_id, user_id, channel_id, upload_result, file_data):
        """
        Update DynamoDB with S3 upload information
        """
        try:
            # Create a new item with S3 information
            timestamp = upload_result['metadata']['upload_timestamp']
            item = {
                'slackChat': f"{user_id}_{timestamp}",
                'user_id': user_id,
                'channel_id': channel_id,
                'file_id': file_id,
                's3_key': upload_result['s3_key'],
                's3_url': upload_result['public_url'],
                'filename': file_data['filename'],
                'file_size': file_data['size'],
                'content_type': file_data['content_type'],
                'timeStamp': timestamp,
                'type': 'file_uploaded',
                'status': 'completed'
            }
            
            self.dynamo_writer.write_message(item)
            print(f"📝 Updated DynamoDB with S3 information for file: {file_id}")
            
        except Exception as e:
            print(f"⚠️ Failed to update DynamoDB with S3 info: {str(e)}")
    
    def receive_and_process_messages(self, max_messages=10, wait_time=20):
        """
        Receive and process messages from SQS queue
        """
        try:
            print(f"📡 Receiving messages from SQS queue: {self.queue_url}")
            
            response = self.sqs_client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time,
                VisibilityTimeout=600  # 10 minutes
            )
            
            messages = response.get('Messages', [])
            print(f"📥 Received {len(messages)} messages from SQS")
            
            processed_count = 0
            failed_count = 0
            
            for message in messages:
                result = self.process_message(message)
                
                if result['success']:
                    # Delete message from queue on success
                    try:
                        self.sqs_client.delete_message(
                            QueueUrl=self.queue_url,
                            ReceiptHandle=message['ReceiptHandle']
                        )
                        print(f"🗑️ Deleted successfully processed message for file: {result.get('file_id', 'unknown')}")
                        processed_count += 1
                    except Exception as e:
                        print(f"⚠️ Failed to delete message: {str(e)}")
                else:
                    print(f"⚠️ Message processing failed: {result.get('error', 'Unknown error')}")
                    failed_count += 1
            
            print(f"📊 Processing summary: {processed_count} successful, {failed_count} failed")
            return {
                'processed': processed_count,
                'failed': failed_count,
                'total': len(messages)
            }
            
        except Exception as e:
            print(f"❌ Error receiving messages from SQS: {str(e)}")
            return {
                'processed': 0,
                'failed': 0,
                'total': 0,
                'error': str(e)
            }
    
    def process_continuously(self, max_iterations=10, messages_per_batch=10):
        """
        Continuously process messages until queue is empty or max iterations reached
        """
        print(f"🔄 Starting continuous message processing (max {max_iterations} iterations)")
        
        total_processed = 0
        total_failed = 0
        
        for iteration in range(max_iterations):
            print(f"\n📋 Iteration {iteration + 1}/{max_iterations}")
            
            result = self.receive_and_process_messages(
                max_messages=messages_per_batch,
                wait_time=5  # Shorter wait time for continuous processing
            )
            
            total_processed += result['processed']
            total_failed += result['failed']
            
            # If no messages were received, we're done
            if result['total'] == 0:
                print("ℹ️ No more messages in queue. Stopping continuous processing.")
                break
        
        print(f"\n✅ Continuous processing completed.")
        print(f"📊 Total summary: {total_processed} successful, {total_failed} failed")
        
        return {
            'total_processed': total_processed,
            'total_failed': total_failed,
            'iterations': iteration + 1
        } 
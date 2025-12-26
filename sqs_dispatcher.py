import json

class SQSDispatcher:
    def __init__(self, sqs_client, queue_url):
        self.sqs_client = sqs_client
        self.queue_url = queue_url

    def send_file_id(self, message_data):
        """
        Send file data to SQS queue
        message_data should be a dictionary containing file_id, user_id, channel_id, and optional url_private
        """
        print(f"📨 Sending file data to SQS queue: {message_data}")
        
        # Ensure required fields exist
        if not message_data.get("file_id"):
            raise ValueError("file_id is required in message_data")
        
        self.sqs_client.send_message(
            QueueUrl=self.queue_url,
            MessageBody=json.dumps(message_data)
        )
        print("✅ File data sent to SQS queue.") 
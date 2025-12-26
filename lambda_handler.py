import json
import base64
import boto3
import os
from slackVerifier import SlackVerifier
from slackEventHandler import SlackEventHandler
from sqsEvent import SQSDispatcher
from dynamodb_writer import DynamoWriter
from sqs_consumer import SQSConsumer

# Initialize AWS resources
print("🔧 Initializing AWS resources...")
dynamodb = boto3.resource('dynamodb')
chat_table = dynamodb.Table('slackChatMessage')
sqs_client = boto3.client('sqs')
s3_client = boto3.client('s3')
SQS_QUEUE_URL = os.environ['SQS_QUEUE_URL']
S3_BUCKET_NAME = os.environ['S3_BUCKET_NAME']
SLACK_BOT_TOKEN = os.environ['SLACK_BOT_TOKEN']

# Initialize service classes
slack_verifier = SlackVerifier()
sqs_dispatcher = SQSDispatcher(sqs_client, SQS_QUEUE_URL)
dynamo_writer = DynamoWriter(chat_table)
slack_handler = SlackEventHandler(sqs_dispatcher, dynamo_writer)
sqs_consumer = SQSConsumer(sqs_client, s3_client, chat_table, SQS_QUEUE_URL, S3_BUCKET_NAME, SLACK_BOT_TOKEN)

def lambda_handler(event, context):
    print("🚀 Lambda triggered.")
    print("📦 Full Event:", json.dumps(event, default=str))

    # Check if this is an SQS event
    if "Records" in event and event["Records"]:
        record = event["Records"][0]
        if record.get("eventSource") == "aws:sqs":
            print("📨 Processing SQS message...")
            print(f"📋 SQS Record structure: {json.dumps(record, default=str)}")
            # Use SQSConsumer to process the message
            result = sqs_consumer.process_message(record)
            if result['success']:
                return {'statusCode': 200, 'body': json.dumps({"message": "File processed and uploaded to S3", "public_url": result.get('public_url')})}
            else:
                return {'statusCode': 500, 'body': json.dumps({"error": result.get('error', 'Failed to process file')})}

    method = event.get("httpMethod") or event.get("requestContext", {}).get("http", {}).get("method", "POST")
    print(f"📡 HTTP Method: {method}")

    try:
        if method == "POST":
            raw_body = event.get("body", "")
            if event.get("isBase64Encoded"):
                print("📦 Decoding base64-encoded body...")
                raw_body = base64.b64decode(raw_body).decode("utf-8")

            headers = {k.lower(): v for k, v in event.get("headers", {}).items()}

            if not slack_verifier.verify_signature(headers, raw_body):
                return {'statusCode': 403, 'body': json.dumps({"text": "❌ Invalid Slack signature"})}

            event_result = slack_handler.handle_event(headers, raw_body)

            # Special case: url_verification
            if event_result.get("type") == "url_verification":
                return {'statusCode': 200, 'body': event_result.get("challenge", "")}
            if event_result.get("error"):
                return {'statusCode': event_result.get("statusCode", 400), 'body': json.dumps({"error": event_result["error"]})}

            response_msg = "✅ Message saved successfully."
            attachments = event_result.get("attachments", [])
            if attachments:
                response_msg += f" {len(attachments)} file(s) metadata stored and sent to SQS."

            return {'statusCode': 200, 'body': json.dumps({"text": response_msg})}

        elif method == "GET":
            print("📤 Handling GET request.")
            query_params = event.get("queryStringParameters") or {}
            channel_id = (query_params.get("channel_id") or "").strip()

            if not channel_id:
                return {'statusCode': 400, 'body': json.dumps({"error": "Missing 'channel_id'"})}

            response = chat_table.query(
                IndexName='channel_id-timeStamp-index',
                KeyConditionExpression=boto3.dynamodb.conditions.Key('channel_id').eq(channel_id),
                ScanIndexForward=True
            )

            items = response.get("Items", [])
            print(f"📥 Retrieved {len(items)} messages.")
            return {'statusCode': 200, 'body': json.dumps(items, default=str)}

        else:
            return {'statusCode': 405, 'body': json.dumps({"error": "Method not allowed"})}

    except Exception as e:
        print(f"❌ Unhandled error: {str(e)}")
        return {'statusCode': 500, 'body': json.dumps({"error": str(e)})} 
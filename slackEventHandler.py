import json
import base64
import urllib.parse
import time
from datetime import datetime
import re
from utils import sanitize_filename
import os
import urllib.request

class SlackEventHandler:
    def __init__(self, sqs_dispatcher, dynamo_writer):
        self.sqs_dispatcher = sqs_dispatcher
        self.dynamo_writer = dynamo_writer

    def handle_event(self, headers, raw_body):
        print("🔎 Parsing Slack event payload...")
        content_type = headers.get("content-type", "")
        if "application/json" in content_type:
            payload = json.loads(raw_body)
            if payload.get("type") == "url_verification":
                return {"type": "url_verification", "challenge": payload.get("challenge", "")}
            slack_event = payload.get("event", {})
            event_type = slack_event.get("type", "")
            print(f"🧩 Event Type: {event_type}")
            if event_type == "file_shared":
                return self.handle_file_shared(slack_event)
            elif event_type == "message":
                return self.handle_message(slack_event)
            elif event_type == "app_mention":
                return self.handle_app_mention(slack_event)
            else:
                print(f"ℹ️ Unhandled event type: {event_type}")
                return self.handle_default(slack_event)
        else:
            print("📝 Handling slash command payload.")
            params = urllib.parse.parse_qs(raw_body)
            return self.handle_slash_command(params)

    def handle_file_shared(self, slack_event):
        user_id = slack_event.get("user_id", "") or slack_event.get("user", "")
        channel_id = slack_event.get("channel_id", "") or slack_event.get("channel", "")
        file_id = slack_event.get("file_id")
        if not file_id:
            print("❌ No file_id in file_shared event")
            return {"error": "No file_id provided", "statusCode": 400}

        # First check if file info is already in the event payload
        file_info = slack_event.get("file", {})
        url_private = file_info.get("url_private", "")
        
        # If not available in payload, try to fetch from Slack API
        if not url_private:
            print(f"🔍 File info not in payload, fetching from Slack API for file_id: {file_id}")
            slack_token = os.environ.get("SLACK_BOT_TOKEN")
            if not slack_token:
                print("❌ SLACK_BOT_TOKEN environment variable not set")
                return {"error": "SLACK_BOT_TOKEN not configured", "statusCode": 500}
                
            try:
                api_url = f"https://slack.com/api/files.info?file={file_id}"
                req = urllib.request.Request(
                    api_url,
                    headers={"Authorization": f"Bearer {slack_token}"}
                )
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read().decode())
                    if data.get("ok") and "file" in data:
                        file_info = data["file"]
                        url_private = file_info.get("url_private", "")
                        print(f"✅ Successfully fetched file info from Slack API")
                    else:
                        print(f"❌ Failed to fetch file info from Slack: {data}")
            except Exception as e:
                print(f"❌ Exception while fetching file info from Slack: {str(e)}")

        if not url_private:
            print(f"⚠️ WARNING: url_private is missing for file_id {file_id}!")
            print(f"📋 Available file info: {file_info}")
        else:
            print(f"✅ Found url_private: {url_private}")
            
        message_data = {
            "file_id": file_id,
            "user_id": user_id,
            "channel_id": channel_id,
            "url_private": url_private
        }
        print("DEBUG: SQS message data (file_shared):", message_data)
        self.sqs_dispatcher.send_file_id(message_data)

        attachments = [{"file_id": file_id}]
        item = self.prepare_item(user_id, channel_id, '', 'file', attachments)
        self.dynamo_writer.write_message(item)
        return {"user_id": user_id, "channel_id": channel_id, "attachments": attachments, "item": item}

    def handle_message(self, slack_event):
        user_id = slack_event.get("user_id", "") or slack_event.get("user", "")
        channel_id = slack_event.get("channel_id", "") or slack_event.get("channel", "")
        text = slack_event.get("text", "")
        files = slack_event.get("files", [])
        attachments = []
        if files:
            print(f"📎 Message contains {len(files)} files.")
            for file_info in files:
                file_id = file_info.get("id")
                if file_id:
                    url_private = file_info.get("url_private", "")
                    if not url_private:
                        print(f"⚠️ WARNING: url_private is missing for file_id {file_id} in message event!")
                    message_data = {
                        "file_id": file_id,
                        "user_id": user_id,
                        "channel_id": channel_id,
                        "url_private": url_private
                    }
                    print("DEBUG: SQS message data (message):", message_data)
                    self.sqs_dispatcher.send_file_id(message_data)
                    attachments.append({"file_id": file_id})
            print("✅ All file data sent to SQS queue.")
        else:
            print("💬 Regular text message, no files attached.")
        item = self.prepare_item(user_id, channel_id, text, 'file' if attachments else 'text', attachments)
        self.dynamo_writer.write_message(item)
        return {"user_id": user_id, "channel_id": channel_id, "attachments": attachments, "item": item, "text": text}

    def handle_app_mention(self, slack_event):
        print("📢 Processing app_mention event.")
        return self.handle_message(slack_event)

    def handle_slash_command(self, params):
        user_id = params.get("user_id", [""])[0]
        user_name = params.get("user_name", [""])[0]
        channel_id = params.get("channel_id", [""])[0]
        text = params.get("text", [""])[0]
        item = self.prepare_item(user_id, channel_id, text, 'text', [])
        self.dynamo_writer.write_message(item)
        return {"user_id": user_id, "channel_id": channel_id, "item": item, "text": text}

    def handle_default(self, slack_event):
        return self.handle_message(slack_event)

    def prepare_item(self, user_id, channel_id, text, msg_type, attachments):
        timestamp = datetime.utcnow().isoformat()
        user_id = user_id or "unknown_user"
        channel_id = channel_id or "unknown_channel"
        item = {
            'slackChat': f"{user_id}_{timestamp}",
            'user_id': user_id,
            'channel_id': channel_id,
            'message': text,
            'timeStamp': timestamp,
            'type': msg_type
        }
        if attachments:
            item['attachments'] = attachments
        return item 
class DynamoWriter:
    def __init__(self, chat_table):
        self.chat_table = chat_table
 
    def write_message(self, item):
        print("💾 Writing item to DynamoDB:", item)
        self.chat_table.put_item(Item=item)
        print("✅ Item written to DynamoDB.") 
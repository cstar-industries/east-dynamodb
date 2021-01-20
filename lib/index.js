import path from 'path';

import { DeleteItemCommand, DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

class Adapter {
  constructor(params) {
    if (!params.tableName) {
      throw new Error('Missing table name in DynamoDB adapter configuration.');
    }

    this.tableName = params.tableName;
    this.partitionKey = params?.primaryKey ?? 'PK';
    this.sortKey = params?.sortKey ?? 'SK';
    this.partitionId = params?.partitionId ?? '_MIGRATIONS';
    this.dynamoDB = params?.dynamoDB || {};
  }

  getTemplatePath() {
    return path.join(__dirname, 'template.js');
  }

  connect() {
    this.client = new DynamoDBClient(this.dynamoDB);
    return { client: this.client, tableName: this.tableName };
  }

  disconnect() {
    this.client.destroy();
  }

  async getExecutedMigrationNames() {
    const migrations = [];
    let cmd, res;
    do {
      cmd = new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': this.partitionKey
        },
        ExpressionAttributeValues: marshall({
          ':pk': this.partitionId
        }),
        ExclusiveStartKey: res?.LastEvaluatedKey
      });
      res = await this.client.send(cmd);
      const items = res.Items.map(unmarshall);
      migrations.push(...items);
    } while (res?.Items?.length && res?.LastEvaluatedKey);

    return migrations.map((m) => m.name);
  }

  async markExecuted(name) {
    const cmd = new PutItemCommand({
      TableName: this.tableName,
      Item: marshall({
        [this.partitionKey]: this.partitionId,
        [this.sortKey]: name
      })
    });
    await this.client.send(cmd);
  }

  async unmarkExecuted(name) {
    const cmd = new DeleteItemCommand({
      TableName: this.tableName,
      Key: marshall({
        [this.partitionKey]: this.partitionId,
        [this.sortKey]: name
      })
    });
    await this.client.send(cmd);
  }
}

export default Adapter;

const { BatchWriteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const itemCount = 10;

exports.migrate = async ({ client, tableName }) => {
  const items = [...new Array(itemCount).keys()].map((i) => ({
    PK: 'ITEM',
    SK: `ITEM#${i.toString().padStart(4, '0')}`,
    rank: Math.random(),
    label: `Item ${i}`
  }));
  const cmd = new BatchWriteItemCommand({
    RequestItems: {
      [tableName]: items.map((item) => ({ PutRequest: { Item: marshall(item) } }))
    }
  });
  await client.send(cmd);
};

exports.rollback = async ({ client, tableName }) => {
  const keys = [...new Array(itemCount).keys()].map((i) => ({
    PK: 'ITEM',
    SK: `ITEM#${i.toString().padStart(4, '0')}`
  }));
  const cmd = new BatchWriteItemCommand({
    RequestItems: {
      [tableName]: keys.map((key) => ({ DeleteRequest: { Key: marshall(key) } }))
    }
  });
  await client.send(cmd);
};

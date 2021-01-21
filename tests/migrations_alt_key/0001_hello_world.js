const { PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

export const migrate = async ({ client, tableName }) => {
  const cmd = new PutItemCommand({
    TableName: tableName,
    Item: marshall({
      Type: 'Hello',
      Name: 'World'
    })
  });
  await client.send(cmd);
};

export const rollback = async ({ client, tableName }) => {
  const cmd = new DeleteItemCommand({
    TableName: tableName,
    Key: marshall({
      Type: 'Hello',
      Name: 'World'
    })
  });
  await client.send(cmd);
};

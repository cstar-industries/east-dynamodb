const { PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

exports.migrate = async ({ client, tableName }) => {
  const cmd = new PutItemCommand({
    TableName: tableName,
    Item: marshall({
      PK: 'Hello',
      SK: 'World'
    })
  });
  await client.send(cmd);
};

exports.rollback = async ({ client, tableName }) => {
  const cmd = new DeleteItemCommand({
    TableName: tableName,
    Key: marshall({
      PK: 'Hello',
      SK: 'World'
    })
  });
  await client.send(cmd);
};

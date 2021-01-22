import describeTestSuite from './describe-test-suite';

describeTestSuite(
  'alt_key',
  {
    pk: 'Type',
    sk: 'Name',
    adapterConfig: {
      tableName: 'east-dynamodb-test-alt-key',
      partitionKey: 'Type',
      sortKey: 'Name',
      dynamoDB: {
        region: 'ddblocal',
        endpoint: 'http://localhost:8000'
      }
    }
  },
  {
    Type: 'Hello',
    Name: 'World'
  }
);

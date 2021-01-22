import describeTestSuite from './describe-test-suite';

describeTestSuite(
  'default',
  {
    pk: 'PK',
    sk: 'SK',
    adapterConfig: {
      tableName: 'east-dynamodb-test-default',
      dynamoDB: {
        region: 'ddblocal',
        endpoint: 'http://localhost:8000'
      }
    }
  },
  {
    PK: 'Hello',
    SK: 'World'
  }
);

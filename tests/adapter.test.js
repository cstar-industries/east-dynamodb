import describeTestSuite from './describe-test-suite';

const defaultConfig = {
  tableName: 'east-dynamodb-test',
  dynamoDB: {
    endpoint: 'http://localhost:8000'
  }
};

describeTestSuite('default', defaultConfig);

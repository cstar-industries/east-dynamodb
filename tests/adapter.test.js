import describe from './describe';

const defaultConfig = {
  tableName: 'east-dynamodb-test',
  dynamoDB: {
    endpoint: 'http://localhost:8000'
  }
};

describe('default', defaultConfig);

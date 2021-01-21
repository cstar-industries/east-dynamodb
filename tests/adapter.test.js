import fs from 'fs';
import path from 'path';

import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  GetItemCommand,
  QueryCommand
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { MigrationManager } from 'east';

import Adapter from '../lib';

const config = {
  tableName: 'east-dynamodb-test',
  dynamoDB: {
    endpoint: 'http://localhost:8000'
  }
};

const helloWorld = marshall({
  PK: 'Hello',
  SK: 'World'
});

describe('Test DynamoDB Adapter', () => {
  beforeAll(async () => {
    // Create test table
    const client = new DynamoDBClient(config.dynamoDB);
    const cmd = new CreateTableCommand({
      TableName: config.tableName,
      AttributeDefinitions: [
        { AttributeName: 'PK', AttributeType: 'S' },
        { AttributeName: 'SK', AttributeType: 'S' },
        { AttributeName: 'migration', AttributeType: 'S' },
        { AttributeName: 'migration_name', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'PK', KeyType: 'HASH' },
        { AttributeName: 'SK', KeyType: 'RANGE' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'Migrations',
          KeySchema: [
            { AttributeName: 'migration', KeyType: 'HASH' },
            { AttributeName: 'migration_name', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'KEYS_ONLY' }
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });
    await client.send(cmd);
  });

  afterAll(async () => {
    // Destroy test table
    const client = new DynamoDBClient(config.dynamoDB);
    const cmd = new DeleteTableCommand({ TableName: config.tableName });
    await client.send(cmd);
  });

  test('templates exist', () => {
    const adapter = new Adapter(config);
    const templatePath = adapter.getTemplatePath();
    expect(fs.existsSync(templatePath)).toBeTrue();
  });

  test('simple connect succeeds', () => {
    const adapter = new Adapter(config);
    const ctx = adapter.connect();
    expect(ctx.tableName).toBe(config.tableName);
    expect(ctx.client).toBeInstanceOf(DynamoDBClient);
  });

  test('connect without table name fails', () => {
    expect(() => new Adapter()).toThrow();
  });

  test('getExecutedMigrationNames (before migrations)', async () => {
    const adapter = new Adapter(config);
    adapter.connect();
    const names = await adapter.getExecutedMigrationNames();
    expect(names).toBeArrayOfSize(0);
  });

  test('apply migrations', async () => {
    const mgr = new MigrationManager();

    const eastConfig = { dir: path.join(__dirname, 'migrations'), adapter: './lib', ...config };
    await mgr.configure(eastConfig);
    await mgr.connect();
    await mgr.migrate({});

    const client = new DynamoDBClient(config.dynamoDB);

    let cmd = new GetItemCommand({
      TableName: config.tableName,
      Key: helloWorld
    });
    let res = await client.send(cmd);
    expect(res.Item).toEqual(helloWorld);

    cmd = new QueryCommand({
      TableName: config.tableName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'PK'
      },
      ExpressionAttributeValues: marshall({
        ':pk': 'ITEM'
      })
    });
    res = await client.send(cmd);
    expect(res.Items).toBeArrayOfSize(10);
  });

  test('getExecutedMigrationNames (after migrations)', async () => {
    const adapter = new Adapter(config);
    adapter.connect();
    const names = await adapter.getExecutedMigrationNames();
    expect(names).toBeArrayOfSize(2);
  });

  test('rollback migrations', async () => {
    const mgr = new MigrationManager();

    const eastConfig = { dir: path.join(__dirname, 'migrations'), adapter: './lib', ...config };
    await mgr.configure(eastConfig);
    await mgr.connect();
    await mgr.rollback({});

    const client = new DynamoDBClient(config.dynamoDB);

    let cmd = new GetItemCommand({
      TableName: config.tableName,
      Key: helloWorld
    });
    let res = await client.send(cmd);
    expect(res.Item).toBeUndefined();

    cmd = new QueryCommand({
      TableName: config.tableName,
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: {
        '#pk': 'PK'
      },
      ExpressionAttributeValues: marshall({
        ':pk': 'ITEM'
      })
    });
    res = await client.send(cmd);
    expect(res.Items).toBeArrayOfSize(0);
  });

  test('getExecutedMigrationNames (after rollback)', async () => {
    const adapter = new Adapter(config);
    adapter.connect();
    const names = await adapter.getExecutedMigrationNames();
    expect(names).toBeArrayOfSize(0);
  });
});

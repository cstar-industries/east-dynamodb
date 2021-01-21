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

export default (suiteName, suiteConfig, testItem) => {
  describe(`[${suiteName}] Test DynamoDB Adapter`, () => {
    const config = suiteConfig.adapterConfig;

    testItem = marshall(testItem);

    beforeAll(async () => {
      // Create test table
      const client = new DynamoDBClient(config.dynamoDB);
      const cmd = new CreateTableCommand({
        TableName: config.tableName,
        AttributeDefinitions: [
          { AttributeName: suiteConfig.pk, AttributeType: 'S' },
          { AttributeName: suiteConfig.sk, AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: suiteConfig.pk, KeyType: 'HASH' },
          { AttributeName: suiteConfig.sk, KeyType: 'RANGE' }
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

      const eastConfig = { dir: path.join(__dirname, `migrations_${suiteName}`), adapter: './lib', ...config };
      await mgr.configure(eastConfig);
      await mgr.connect();
      await mgr.migrate({});

      const client = new DynamoDBClient(config.dynamoDB);

      let cmd = new GetItemCommand({
        TableName: config.tableName,
        Key: testItem
      });
      let res = await client.send(cmd);
      expect(res.Item).toEqual(testItem);

      cmd = new QueryCommand({
        TableName: config.tableName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': suiteConfig.pk
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

      const eastConfig = { dir: path.join(__dirname, `migrations_${suiteName}`), adapter: './lib', ...config };
      await mgr.configure(eastConfig);
      await mgr.connect();
      await mgr.rollback({});

      const client = new DynamoDBClient(config.dynamoDB);

      let cmd = new GetItemCommand({
        TableName: config.tableName,
        Key: testItem
      });
      let res = await client.send(cmd);
      expect(res.Item).toBeUndefined();

      cmd = new QueryCommand({
        TableName: config.tableName,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': suiteConfig.pk
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
};

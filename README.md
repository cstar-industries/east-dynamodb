# east dynamodb

AWS DynamoDB adapter for [`east`](https://github.com/okv/east) migration tool.

`east-dynamodb` relies on [AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3).

## Requirements

- `east-dynamodb` requires Node.js 10 or above.
- `east` is required to run the migrations, `east-dynamodb` is only a plug-in.
- The AWS SDK modules for DynamoDB are specified as peer dependencies, and must
  be installed separately from the package.

## Installation

```shell
# Install east
npm install --save-dev east

# Install east DynamoDB adapter
npm install --save-dev east-dynamodb

## Install AWS SDK peer dependencies
npm install --save-dev @aws-sdk/client-dynamodb@3.x @aws-sdk/util-dynamodb@3.x
```

> :bulb: Migrations are usually a development tool, so we recommend installing
> `east` as a dev dependency.

## Configuration

Create a `.eastrc` file in your project root directory, and write the east
configuration in JSON. A simple configuration example:

```json
{
  "adapter": "east-dynamodb",
  "tableName": "MyTable",
  "dynamoDB": {
    "region": "us-east-1"
  }
}
```

The above configuration can be used to apply and rollback migrations on a
DynamoDB table named `MyTable` in AWS region `us-east-1`, where _partition key_
is `PK` and _sort key_ is `SK`.

### Configuration reference

```json
{
  // Required. Tell east to use DynamoDB adapter.
  "adapter": "east-dynamodb",
  // Required. The name of the DynamoDB table to migrate
  "tableName": "MyTable",
  // Optional, default "PK". The name of the partition key (or "hash key") in
  // the table.
  "partitionKey": "PK",
  // Optional, default "SK". The name of the sort key (or "range key") in
  // the table.
  "sortKey": "SK",
  // Optional, default "_MIGRATIONS". The "partition ID" of the migrations items
  // in the table, i.e. the value set in the partition key of the primary key.
  "migrationId": "_MIGRATIONS",
  // Optional, default undefined. Configuration options for DynamoDBClient as
  // specified in the AWS JS SDK.
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html
  "dynamoDB": {
    // Region may be required.
    "region": "eu-west-3"
  }
}
```

See the [official documentation](https://github.com/okv/east) for more details
on how to work with east.

### Known limitations

#### Primary key

`east-dynamodb` can only work on tables with a composite primary key. To list
all migrations applied in order, DynamoDB requires all migration entries to
share a partition, and sorts all migrations by name in the sort key.

#### Secondary indexes

Secondary indexes are not supported yet. `east-dynamodb` creates an item in the
table for each migration, and automatically generates values for primary key
fields. It has no instructions to derive values for partition key and sort key
for an arbitrary index.

#### Transactions

DynamoDB does not support transactions. It is recommend to disconnect all
services from your table during migrations. Any concurrent write to the table
could result in an inconsistent state, breaking your database and related
services.

In any case, it is always a good idea to backup a table before performing
migrations.

## Migrations

Migrations are ordered JavaScript files in a directory (see `east`
[documentation](https://github.com/okv/east)). `east` executes all un-executed
migration scripts sequentially, and marks each migration as applied in the table
when done.

To create a migration file, use `east` cli:

```shell
east create <migration_name>
```

`east` will create an empty migration script from the template in
[`lib/template.js`](lib/template.js). The template exposes 2 functions:
`migrate` and `rollback`. These functions will be run when `east migrate` or
`east rollback` is invoked, respectively.

The functions take a single "context" argument containing objects and data
necessary for the current migration.

- `client`: a [`DynamoDBClient`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/dynamodbclient.html)
  instance from AWS SDK for JS 3. Performing operations on the table will be done
  by sending commands through this client.
- `tableName`: the name of the table being migrated (`string`).

### Example migration

Let's see an example of a migration.

```javascript
const { PutItemCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

exports.migrate = async ({ client, tableName }) => {
  const cmd = new PutItemCommand({
    TableName: tableName,
    Item: marshall({
      PK: 'USERS',
      SK: 'USERS#0000001',
      first_name: 'Obi-Wan',
      last_name: 'Kenobi',
      greeting: 'Hello there',
    }),
  });
  await client.send(cmd);
};

exports.rollback = async ({ client, tableName }) => {
  const cmd = new DeleteItemCommand({
    TableName: tableName,
    Key: marshall({
      PK: 'USERS',
      SK: 'USERS#0000001',
    }),
  });
  await client.send(cmd);
};
```

The above migration script creates a new item in the table, for user Obi-Wan
Kenobi. We use [`PutItemCommand`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/putitemcommand.html)
as required by AWS SDK. A command is sent to DynamoDB through the DynamoDB
Client. The call to the database is asynchronous by nature, we use
`async`/`await` here to ensure the program waits until the request is completed
before resuming flow. You could also chain and return a Promise, and `east`
would wait until all Promises are resolved before starting the next migration.

The rollback operation is similar in design, using a [`DeleteItemCommand`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/classes/deleteitemcommand.html)
to remove the item added in the forward migration. Deleting an item only
requires its (composite) primary key as parameters.

Note the use of `marshall` from [`@aws-sdk/util-dynamodb`](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_util_dynamodb.html).
`marshall` converts a plain JavaScript object to a DynamoDB record, making for
much lighter code.

```javascript
const record = marshall({
  hello: 'there',
  num: 1138,
});
console.log(record);
// {
//   hello: { S: 'there' },
//   num: { N: 1138 }
// }
```

## Contributing

`east-dynamodb` is an open-source effort to help manage migrations in DynamoDB
tables from Node.js projects.

If you find a bug or if you want to request a new feature, please report it by
opening an issue. Pull Requests are also welcome.

### Developer commands

#### Run linter

```shell
npm run lint
```

#### Run tests

```shell
npm run test
```

#### Build distribution

```shell
npm run build
```

## License

This project is licensed under the [Apache 2.0 license](LICENSE.txt).

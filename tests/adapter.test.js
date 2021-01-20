import fs from 'fs';

import Adapter from '../lib';

describe('Test DynamoDB Adapter', () => {
  test('templates exist', () => {
    const adapter = new Adapter();
    const templatePath = adapter.getTemplatePath();
    expect(fs.existsSync(templatePath)).toBeTrue();
  });
});

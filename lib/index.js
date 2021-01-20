import path from 'path';

class Adapter {
  constructor() {}

  getTemplatePath() {
    return path.join(__dirname, 'templates.js');
  }
}

export default Adapter;

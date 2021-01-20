import path from 'path';

class Adapter {
  constructor() {}

  getTemplatePath() {
    return path.join(__dirname, 'template.js');
  }
}

export default Adapter;

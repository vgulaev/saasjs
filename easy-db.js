const fs = require('fs');

exports.db = function () {
  this.data = {};
  this.filename = 'log/db/data.json';

  if (fs.existsSync(this.filename)) {
    this.data = JSON.parse(fs.readFileSync(this.filename, 'utf-8'));
  }

  this.save = function () {
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
  };
}

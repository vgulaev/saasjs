const fs = require('fs');

exports.config = function () {
  var content = JSON.parse(fs.readFileSync('config/environment.json'));
  for (var e of Object.keys(content)) {
    this[e] = content[e];
  }

  this.mysqlxCred = {
      password: this.db.pass,
      user: this.db.user,
      host: this.db.host,
      schema: 'eycost'
  };
}

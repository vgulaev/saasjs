const mysqlx = require('@mysql/xdevapi');
const fs = require('fs');

var config = new (require('./config').config)();

exports.easyDB = function () {
  this.data = {};
  this.filename = 'log/db/data.json';

  if (fs.existsSync(this.filename)) {
    this.data = JSON.parse(fs.readFileSync(this.filename, 'utf-8'));
  }

  this.save = function () {
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
  };
}

exports.db = function (res) {
  return res.c.env.db;
}

exports.query = function(q, resultCallback, metaCallback) {
  return new Promise(function (resolve, reject) {
    mysqlx
      .getSession(config.mysqlxCred)
      .then(session => {
        session
          .sql(q)
          .execute(result => {
            if (typeof resultCallback === "function") resultCallback(result);
          }, meta => {
            if (typeof metaCallback === "function") metaCallback(meta);
          })
          .then(() => {
            session.close();
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
        });
    });
}
const fs        = require('fs');
const mysql     = require('mysql');
const mysqlx    = require('@mysql/xdevapi');
const { spawn } = require('child_process');
var config      = new (require('./config').config)();
let port        = 16003;

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

exports.queryOverSsh = function(source) {
  this.reformat = function (rows, fields) {
    if (typeof this.metaCallback === "function") this.metaCallback(fields);
    if ((typeof this.resultCallback === "function") && (rows.length > 0)) {
      let keys = Object.keys(rows[0]);
      rows.forEach((r) => this.resultCallback(keys.map(e => r[e])));
    }
  };

  this.checkConnection = (q) => {
    let mysqlxCred = Object.assign({port: port}, config['awsdb']);
    var connection = mysql.createConnection(mysqlxCred);
    connection.connect();

    connection.query(q, (error, results, fields) => {
      if (error) {

      };
      this.reformat(results, fields);
      saasjs.kill();
      this.resolveCallBack();
    });
    connection.end();
  }

  this.makeQuery = () => {
      let sshToMySQL = `ssh -i ${config.sshProd} root@ec2-35-174-170-252.compute-1.amazonaws.com -L ${port}:localhost:3306`;
      let q = "SELECT type, id, provisioned_id, provisioner_id FROM awsm_production.providers where provisioned_id = '956186766273'";
      // let q = 'sdfsdfsdf';

      saasjs = spawn(sshToMySQL, [], {shell: true});
      saasjs.stdout.on('data', (data) => {
        this.checkConnection(q);
      });
  };

  this.query = (q, resultCallback, metaCallback) => {
    return new Promise((resolve, reject) => {
      this.resultCallback = resultCallback;
      this.metaCallback = metaCallback;
      this.resolveCallBack = resolve;
      this.makeQuery();
    });
  };
}

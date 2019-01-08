const fs = require('fs');
const mysqlx = require('@mysql/xdevapi');
const {sendJSON} = require('./sendJSON');

var config = new (require('./config').config)();

exports.post = function (res, data) {
  // let filename = './config/authorized.json';
  // let email = (JSON.parse(data)).email;
  // let list = JSON.parse(fs.readFileSync(filename, 'utf-8'));
  // list.push(email);
  // fs.writeFileSync(filename, JSON.stringify([...new Set(list)]));
   let rows = [];
   let header = [];
   mysqlx
    .getSession(config.mysqlxCred)
    .then(session => {
      session.sql(data).execute(result => {
        rows.push(result);
      }, meta => {
        header = meta.map(el => el.name);
      })
        .then(function() {
          let hash = {
            status: 'ok',
            generatedAt: (new Date).toISOString(),
            header: header,
            result: rows};
            sendJSON(res, hash);
        })
        .catch(err => {
            sendJSON(res, {status: 'error', msg: err.message});
        });
    });
}

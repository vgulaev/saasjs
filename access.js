const fs = require('fs');
const {sendJSON} = require('./sendJSON');

exports.post = function (res, data) {
  let filename = './config/authorized.json';
  let email = (JSON.parse(data)).email;
  let list = JSON.parse(fs.readFileSync(filename, 'utf-8'));
  list.push(email);
  fs.writeFileSync(filename, JSON.stringify([...new Set(list)]));
  sendJSON(res, {status: 'ok'})
}

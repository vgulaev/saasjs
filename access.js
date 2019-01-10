const fs = require('fs');
const {sendJSON} = require('./sendJSON');

exports.post = function (res, data) {
  let filename = './config/authorized.json';
  let newUser = JSON.parse(`{${data}}`);
  let list = JSON.parse(fs.readFileSync(filename, 'utf-8'));
  Object.keys(newUser).forEach(e => {
    list[e] = newUser[e];
  });
  fs.writeFileSync(filename, JSON.stringify(list));
  require('./custom-oauth').reloadAuthorized();
  sendJSON(res, {status: 'ok'})
}

const {sendJSON} = require('./sendJSON');
const {query} = require('./easy-db');

exports.post = function (res, data) {
  let rows = [];
  let header = [];
  query(data, result => {
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
}

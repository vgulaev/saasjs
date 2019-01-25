const {sendJSON} = require('./sendJSON');
const {query} = require('./easy-db');

function securityCheck(data) {
  let lowerText = data.toLowerCase();
  for (let e of ['delete', 'drop', 'alter', 'execute', 'show', 'update', 'insert', 'create', 'replace', 'import', 'load']) {
    if (-1 != data.indexOf(e)) {
      return false;
    }
  }
  return true;
}

exports.post = function (res, data) {
  if (!securityCheck(data)) {
    sendJSON(res, {status: 'error', msg: 'Only SELECT statement allowed'});
    return;
  }
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

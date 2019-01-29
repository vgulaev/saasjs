const {sendJSON} = require('./sendJSON');
const {query, queryOverSsh} = require('./easy-db');

function securityCheck(data) {
  let lowerText = data.toLowerCase();
  for (let e of ['delete', 'drop', 'alter', 'execute', 'show', 'update', 'insert', 'create', 'replace', 'import', 'load']) {
    if (-1 != data.indexOf(e)) {
      return false;
    }
  }
  return true;
}

exports.post = function (res, strData) {
  let data = JSON.parse(strData);
  console.log(data);
  if (!securityCheck(data.q)) {
    sendJSON(res, {status: 'error', msg: 'Only SELECT statement allowed'});
    return;
  }
  let rows = [];
  let header = [];
  let queryFunction = query;
  if ('awsm_prod' == data.s) {
    queryFunction = (new queryOverSsh(data.s)).query;
  }
  queryFunction(data.q, result => {
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

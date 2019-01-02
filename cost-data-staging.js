const fs          = require('fs');
const mysqlx      = require('@mysql/xdevapi');
const {sendJSON}  = require('./sendJSON');
var config        = new (require('./config').config)();

var fileReport = './log/tmp/staging-cost-data.json';
function query(session) {
  let {acc} = require('./lib/staging-accounts.js')

  let staging = Object.keys(acc).sort();
  let q = staging.map((name) => {
    let accs = acc[name].map((aws_id) => `'${aws_id}'`).join(',');
    return `sum(IF(aws_id in (${accs}), cost, 0)) ${name}`;
  }).join(',');
  q = `select day, ${q},
    sum(cost) total
    from eycost.dc_accounts
    group by day
    order by day desc`;

  let rows = [];

  session.sql(q).execute(result => {
    result[0] = result[0].toISOString().substring(0, 10);
    for (var i = 1; i < result.length; i++) {
      result[i] = Math.round(result[i] * 100) / 100;
    }
    rows.push(result);
  }).then(function() {
    fs.writeFileSync(fileReport, JSON.stringify({
      generatedAt: (new Date).toISOString(),
      header: ['day'].concat(staging).concat('total'),
      result: rows}, null, config.JSONspace));
  });
  session.close();
}

exports.update = function() {
 mysqlx
  .getSession(config.mysqlxCred)
  .then(session => {
    query(session);
  })
}

exports.report = function(res) {
  if (undefined == res.sessionId) {
    res.writeHead(302, {
      'Location': 'unauthorized.htmljs',
    });
    res.end();
    return;
  } else {
    var data = {
      status: 'success',
      data: fs.readFileSync(fileReport, 'utf-8')
    };

    sendJSON(res, data);
  }
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    exports.update();
  }
}

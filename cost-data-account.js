const fs              = require('fs');
const mysqlx          = require('@mysql/xdevapi');
const uuidv4          = require('uuid/v4');
const {sendJSON}      = require('./sendJSON');

var config        = new (require('./config').config)();

function query(session, params, resolve) {
  let aws_ids = params.substring(2).split(',');
  let where = aws_ids.map((el) => `'${el}'`).join(',');
  let sum = aws_ids.map((el) => `sum(if(aws_id = '${el}', cost, 0)) a${el}`).join(',');

  q = `select day,
    ${sum},
    sum(cost) total
    from eycost.dailycost
    where aws_id in (${where})
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
    let data = {
      generatedAt: (new Date).toISOString(),
      header: ['day'].concat(aws_ids).concat('total'),
      result: rows};
    resolve(data);
  });
  session.close();
}

function report(params) {
  return new Promise(function (resolve, reject) {
     mysqlx
      .getSession(config.mysqlxCred)
      .then(session => {
        query(session, params, resolve);
      })
  });
}

exports.route = function(res) {
  if (undefined == res.sessionId) {
    res.writeHead(302, {
      'Location': 'unauthorized.htmljs',
    });
    res.end();
    return;
  }
  if (undefined == res.c.urlParsed['query']) {
    sendJSON(res, data = {status: 'Should use any account filter'});
  } else {
    report(res.c.urlParsed['query'])
      .then((data) => {
        sendJSON(res, {status: 'Success', data: data});
      });
  }
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    exports.update();
  }
}

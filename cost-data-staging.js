const fs              = require('fs');
const mysqlx          = require('@mysql/xdevapi');
const uuidv4          = require('uuid/v4');
const {isRoot}        = require('./role-mng')
const {semaphorOpen}  = require('./semaphor-open');
const {sendJSON}      = require('./sendJSON');
const {spawn}         = require('child_process');

var config        = new (require('./config').config)();

var fileReport = './log/tmp/staging-cost-data.json';
function query(session) {
  let {acc} = require('./lib/staging-accounts.js');

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

function requestDataFromAWS(res) {
  return new Promise(function (resolve, reject) {
    let filename = `./log/consoleOutput/${(new Date).toISOString().replace(/[:, \.]/g, '-')}-${uuidv4()}.txt`;

    if (!isRoot(res) && !semaphorOpen(res, 'requestDataFromAWS', 10)) {
      sendJSON(res, {status: 'Please wait 10 minutes and repeat'});
      reject();
      return;
    }
    res.c.env.semaphore['requestDataFromAWS'] = new Date;

    fs.writeFileSync(filename, '');
    let cmd = spawn('cd ../work_in_XO/ && ruby aws_ct_accounts.rb', [],{shell: true});

    cmd.stdout.on('data', (data) => {
      fs.appendFileSync(filename, data);
    });

    cmd.stderr.on('data', (data) => {
      fs.appendFileSync(filename, data);
    });

    cmd.on('close', (code) => {
      resolve();
    });
    sendJSON(res, {status: 'Data requested'});
  });
}

exports.route = function(res) {
  if (undefined == res.sessionId) {
    res.writeHead(302, {
      'Location': 'unauthorized.htmljs',
    });
    res.end();
    return;
  } else {
    if (undefined == res.c.urlParsed['query']) {
      exports.report(res);
    } else if ('o=requestDataFromAWS' == res.c.urlParsed['query']){
      requestDataFromAWS(res)
        .then(() => exports.update());
    } else {
      throw `${res.c.url} haven't correct route`;
    }
  }
}

exports.update = function() {
 mysqlx
  .getSession(config.mysqlxCred)
  .then(session => {
    query(session);
  });
}

exports.report = function(res) {
  var data = {
    status: 'success',
    data: fs.readFileSync(fileReport, 'utf-8')
  };

  sendJSON(res, data);
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    exports.update();
  }
}

const fs          = require('fs');
const mysqlx      = require('@mysql/xdevapi');
const {sendJSON}  = require('./sendJSON');
var config        = new (require('./config').config)();

var fileReport = './log/tmp/staging-cost-data.json';
function query(session) {
  let acc = {
    'sunset': ['189666226278'],
    'buckman': ['122880308646'],
    'berkeley':  ['674983257772','716952778020','331185794337','207974629077','915827841790','530320066328','220529486340'],
    'mission': ['911386416671','','334397946686','296675980652','320279224776','754246874302','238135973580','364874774408','321295208376','950847117775','324510895187','809335548912','631257853160','421378485596','246881330130','130438645015','242132392918','829886021365','766659557426','963516648353','695009134230','163536136915','994677631683','836553431131','509756267469','2795505390','21605290130','467585784670','235528494705','323854357695','955913421617','649887481547','599631167290','131567462040','919416291268','620068220047'],
    'common': [ '035889022258', '978581608272', '956186766273']
  }

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
      result: rows}, null, 2));
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

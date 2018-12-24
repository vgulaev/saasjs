const mysqlx = require('@mysql/xdevapi');
const fs = require('fs');

var config = new (require('./config').config)();
var fileReport = './log/tmp/weekly-cost-data.json';

function query(session) {
  var q = `select DATE_FORMAT(week, '%Y-%m-%d') week,
      sum(if('RI' = cat1, cost, 0))/1000 RI,
      sum(if('staff'   = cat1 and 0 = del, cost, 0))/1000/7*365 staff,
      sum(if('staging' = cat2 and 0 = del, cost, 0))/1000/7*365 staging,
      sum(if('normal'  = cat1 and 0 = del, cost, 0))/1000/7*365 normal,
      sum(if('beta'    = cat1 and 0 = del, cost, 0))/1000/7*365 beta,
      sum(if('trial'   = cat1 and 0 = del, cost, 0))/1000/7*365 trial,
      sum(if(                     1 = del, cost, 0))/1000/7*365 deleted,
      sum(if(cat1 is NULL     and 0 = del, cost, 0))/1000/7*365 undef,
      sum(if('hard'    = cat1 and 0 = del, cost, 0))/1000/7*365 hard,
      sum(cost)/1000 total
      from (select SUBDATE(day, WEEKDAY(day)) week,
      category1 cat1, category2 cat2,
      dailycost.aws_id aws_id,
      if( deleted_at is NULL or deleted_at > day, 0, 1 ) del,
      deleted_at, sum(cost) cost from eycost.dailycost
      left join eycost.aws_acc on aws_acc.aws_id = dailycost.aws_id
      group by week, cat1, cat2, dailycost.aws_id, deleted_at, del) t1
      group by week
      order by week desc;`;
  // q = `select * from eycost.dailycost limit 2`;
  var rows = [];
  session.sql(q).execute(result => {
    rows.push(result);
  }).then(function() {
    fs.writeFileSync(fileReport, JSON.stringify({
      generatedAt: (new Date).toISOString(),
      header: ['week', 'RI', 'staff', 'staging', 'normal', 'beta', 'trial', 'deleted', 'undef', 'hard', 'total'],
      result: rows}, null, 2));
  });
  session.close();
}

exports.update = function() {
  var db_cred = config.db;

  const dbCred = {
      password: db_cred.pass,
      user: db_cred.user,
      host: db_cred.host,
      schema: 'eycost'
  };

 mysqlx
  .getSession(dbCred)
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
    res.writeHead(200, {
      'Content-Type': 'application/json'
    });
    var data = {
      status: 'success',
      data: fs.readFileSync(fileReport, 'utf-8')
    };
    res.end(JSON.stringify(data));
  }
}

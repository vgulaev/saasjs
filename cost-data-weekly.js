const fs          = require('fs');
const mysqlx      = require('@mysql/xdevapi');
const {sendJSON}  = require('./sendJSON');
var config        = new (require('./config').config)();

var fileReport = './log/tmp/weekly-cost-data';

function query(granularity) {
  if ('weekly' == granularity) {
    return `select DATE_FORMAT(week, '%Y-%m-%d') week,
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
  } else {
    return `select DATE_FORMAT(lastDay, '%Y-%m-01') week,
      sum(if('RI' = cat1, cost, 0))/1000 RI,
      sum(if('staff'   = cat1 and 0 = del, cost, 0) / Day(lastDay))/1000*365 staff,
      sum(if('staging' = cat2 and 0 = del, cost, 0) / Day(lastDay))/1000*365 staging,
      sum(if('normal'  = cat1 and 0 = del, cost, 0) / Day(lastDay))/1000*365 normal,
      sum(if('beta'    = cat1 and 0 = del, cost, 0) / Day(lastDay))/1000*365 beta,
      sum(if('trial'   = cat1 and 0 = del, cost, 0) / Day(lastDay))/1000*365 trial,
      sum(if(                     1 = del, cost, 0) / Day(lastDay))/1000*365 deleted,
      sum(if(cat1 is NULL     and 0 = del, cost, 0) / Day(lastDay))/1000*365 undef,
      sum(if('hard'    = cat1 and 0 = del, cost, 0) / Day(lastDay))/1000*365 hard,
      sum(cost)/1000 total
      from (select LAST_DAY(day) month, max(day) lastDay,
      category1 cat1, category2 cat2,
      dailycost.aws_id aws_id,
      if( deleted_at is NULL or deleted_at > day, 0, 1 ) del,
      deleted_at, sum(cost) cost from eycost.dailycost
      left join eycost.aws_acc on aws_acc.aws_id = dailycost.aws_id
      group by month, cat1, cat2, dailycost.aws_id, deleted_at, del) t1
      group by week
      order by week desc;`;
  }
}

function exportToFile(session, granularity) {
  return new Promise(function(resolve, reject) {
  var q = query(granularity);
  var rows = [];
  session.sql(q).execute(result => {
    for (var i = 1; i < result.length; i++) {
      result[i] = Math.round(result[i] * 100) / 100;
    }
    rows.push(result);
  }).then(function() {
    fs.writeFileSync(`${fileReport}-${granularity}.json`, JSON.stringify({
      generatedAt: (new Date).toISOString(),
      header: ['week from', 'RI', 'staff', 'staging', 'normal', 'beta', 'trial', 'deleted', 'undef', 'hard', 'total'],
      result: rows}, null, config.JSONspace));
    });
    resolve();
  });
}

exports.route = function(res) {
  report(res);
}

exports.update = function(granularity) {
  mysqlx
    .getSession(config.mysqlxCred)
    .then(session => {
      Promise.all(granularity.map(e => exportToFile(session, e)))
        .then(() => {
          session.close();
        });
    });
}

function report(res) {
  var data = {
    status: 'success',
    data: fs.readFileSync(`${fileReport}-${res.c.urlParsed['query']}.json`, 'utf-8')
  };
  sendJSON(res, data);
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    if (-1 == ['weekly', 'monthly'].indexOf(process.argv[2])) {
      exports.update(['weekly', 'monthly']);
    } else {
      exports.update([process.argv[2]]);
    }
  }
}

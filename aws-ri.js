const fs = require('fs');
const AWS = require('aws-sdk');
const mysqlx = require('@mysql/xdevapi');

var config = new (require('./config').config)();

let createTable = `
CREATE TABLE awsri (
id int(11) NOT NULL AUTO_INCREMENT,
aws_id varchar(100) DEFAULT NULL,
month varchar(100) DEFAULT NULL,
purchase_type varchar(100) DEFAULT NULL,
region varchar(100) DEFAULT NULL,
instance_type varchar(100) DEFAULT NULL,
hour DECIMAL(16,10) DEFAULT NULL,
cost DECIMAL(16,10) DEFAULT NULL,
PRIMARY KEY (id),
KEY index1 (aws_id)
)`;

function query(session, query) {
  return new Promise(function(resolve, reject) {
    // console.log('query:' + query.length);
    session.sql(query)
      .execute(result => {
        console.log(result);
      })
      .then(() => resolve());
  });
}

mysqlx
  .getSession(config.mysqlxCred)
  .then(session => {
    query(session, "USE eycost")
      .then(() => query(session, "DROP TABLE IF EXISTS awsri"))
      .then(() => query(session, createTable))
      .then(() => dataAWS(session))
      .then(() => session.close());
  });

function pushToDB(session, data) {
  return new Promise(function(resolve, reject) {
  // let data = JSON.parse(fs.readFileSync('log/tmp/ri.json'));

  // console.log(data.length);
  let ins = [];
  while (data.length != 0) {
    let buf = [];
    while (data.length != 0 && buf.length < 900) {
      buf.push(data.shift());
    }
    let v = buf.map((el) => `(${el})`).join(',');
    let q = `INSERT INTO awsri (aws_id, month, purchase_type, region, instance_type, cost, hour) VALUES ${v};`
    ins.push(q);
  }
  ins.reduce((p, f) => p.then(() => query(session, f)), Promise.resolve())
    .then(() => resolve());
  });
}

function dataAWS(session) {
  return new Promise(function(resolve, reject) {

  period = {'start': '2018-06-01', 'end': '2019-01-01' }

  var p1 = {
    Dimension: 'PURCHASE_TYPE', //'USAGE_TYPE_GROUP'
    TimePeriod: {
      End: period['end'],
      Start: period['start']
    },
    Context: 'COST_AND_USAGE'
  };
  // costexplorer.getDimensionValues(p1, function(err, data) {
  //   if (err) console.log(err, err.stack); // an error occurred
  //   else     console.log(JSON.stringify(data));           // successful response
  // });

  let params = {
    TimePeriod: {
      Start: period['start'],
      End: period['end'],
    },
    Granularity: 'MONTHLY', //'DAILY',
    Filter: {
      And: [
        { Dimensions: {
          Key: 'PURCHASE_TYPE',
          Values: []
        }},
        {
          Dimensions: {
          Key: 'USAGE_TYPE_GROUP',
          Values: ['EC2: Running Hours']
          }
        } ]
      },

    // Metrics: ['UnblendedCost'],
    Metrics: ['UsageQuantity', 'UnblendedCost'],
    GroupBy: [
      {
        Type: 'DIMENSION',
        Key: 'REGION',
      },
      {
        Type: 'DIMENSION',
        Key: 'INSTANCE_TYPE',
        // Key: 'PURCHASE_TYPE',
      }
    ],
    // # next_page_token: "NextPageToken",
  }

  var rows = [];
  function pushData(aws_id, purchaseType, data) {
    data.ResultsByTime.forEach((month) => {
      month.Groups.forEach((row) => {
        let csv = [aws_id, month.TimePeriod.Start, purchaseType, ...row.Keys, row.Metrics.UnblendedCost.Amount, row.Metrics.UsageQuantity.Amount].map((el) => `'${el}'`);
        rows.push(csv)
      });
    });
  }

  function queryAws(aws_id, purchaseType) {
    return new Promise(function(resolve, reject) {
      console.log('Proccess: ' + aws_id + purchaseType)
      var aws_cred = JSON.parse(fs.readFileSync(`../work_in_XO/secrets/${aws_id}.json`));
      AWS.config.update({ accessKeyId: aws_cred['AccessKeyId'], secretAccessKey: aws_cred['SecretAccessKey'], region: 'us-east-1' })
      var costexplorer = new AWS.CostExplorer();
      params.Filter.And[0].Dimensions.Values = [purchaseType];
      costexplorer.getCostAndUsage(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          // let output = JSON.stringify(data);
          // console.log(output);
          pushData(aws_id, purchaseType, data);
          pushToDB(session, rows).then(() => {
            // console.log('length: ' + rows.length);
            resolve();
          });
        }
      });
    });
  }

  queryAws('428226229991', 'On Demand Instances')
    .then(() => queryAws('428226229991', 'Standard Reserved Instances'))
    .then(() => queryAws('540235812892', 'On Demand Instances'))
    .then(() => queryAws('540235812892', 'Standard Reserved Instances'))
    .then(() => queryAws('157147590138', 'On Demand Instances'))
    .then(() => queryAws('157147590138', 'Standard Reserved Instances'))
    .then(() => {
      // fs.writeFileSync('log/tmp/ri.json', JSON.stringify(rows));
      resolve(rows);
    });
  });
}

console.log('Data loaded');

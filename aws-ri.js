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
      .then(() => dataAWS())
      .then((q) => query(session, q))
      .then(() => session.close());
  });

function dataAWS() {
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
  function pushData(purchaseType, data) {
    data.ResultsByTime.forEach((month) => {
      month.Groups.forEach((row) => {
        let csv = ['428226229991', month.TimePeriod.Start, purchaseType, ...row.Keys, row.Metrics.UnblendedCost.Amount, row.Metrics.UsageQuantity.Amount].map((el) => `'${el}'`);
        rows.push(csv)
      });
    });
  }

  function queryAws(purchaseType) {
    return new Promise(function(resolve, reject) {
      var aws_cred = JSON.parse(fs.readFileSync('../work_in_XO/secrets/428226229991.json'));
      AWS.config.update({ accessKeyId: aws_cred['AccessKeyId'], secretAccessKey: aws_cred['SecretAccessKey'], region: 'us-east-1' })
      var costexplorer = new AWS.CostExplorer();
      params.Filter.And[0].Dimensions.Values = [purchaseType];
      costexplorer.getCostAndUsage(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          // let output = JSON.stringify(data);
          // console.log(output);
          pushData(purchaseType, data);
          resolve();
          // fs.writeFileSync('log/tmp/ri.json', output);
        }
      });
    });
  }


  // let data = JSON.parse(fs.readFileSync('log/tmp/ri.json'));
  // pushDataToCsv("On Demand Instances", data);

  queryAws("On Demand Instances")
    .then(() => queryAws("Standard Reserved Instances"))
    .then(() => {
      let v = rows.map((el) => `(${el})`).join(',');
      let q = `INSERT INTO awsri (aws_id, month, purchase_type, region, instance_type, cost, hour) VALUES ${v};`
      resolve(q);
    });
  });
}

console.log('Data loaded');

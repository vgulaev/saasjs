const fs = require('fs');
const AWS = require('aws-sdk');
const mysqlx = require('@mysql/xdevapi');

var config = new (require('./config').config)();

// from https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ri-modifying.html#ri-modification-instancemove
let instanceSize = [
['nano', 0.25],
['micro', 0.5],
['small', 1],
['medium', 2],
['large', 4],
['xlarge', 8],
['2xlarge', 16],
['4xlarge', 32],
['8xlarge', 64],
['9xlarge', 72],
['10xlarge', 80],
['12xlarge', 96],
['16xlarge', 128],
['18xlarge', 144],
['24xlarge', 192],
['32xlarge', 256]];

let createTableRI = `
CREATE TABLE awsri (
id int(11) NOT NULL AUTO_INCREMENT,
aws_id varchar(100) DEFAULT NULL,
month varchar(100) DEFAULT NULL,
purchase_type varchar(100) DEFAULT NULL,
size varchar(100) DEFAULT NULL,
region varchar(100) DEFAULT NULL,
instance_type varchar(100) DEFAULT NULL,
hour DECIMAL(16,10) DEFAULT NULL,
cost DECIMAL(16,10) DEFAULT NULL,
PRIMARY KEY (id),
KEY index1 (aws_id)
)`;

let createTableInstanceSize = `
CREATE TABLE instanceSize (
id int(11) NOT NULL AUTO_INCREMENT,
size varchar(100) DEFAULT NULL,
factor DECIMAL(5,2) DEFAULT NULL,
PRIMARY KEY (id)
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
      .then(() => query(session, "DROP TABLE IF EXISTS instanceSize"))
      .then(() => query(session, createTableInstanceSize))
      .then(() => query(session, pushInstanceType()))
      .then(() => query(session, "DROP TABLE IF EXISTS awsri"))
      .then(() => query(session, createTableRI))
      .then(() => dataAWS(session))
      .then(() => session.close());
  });

function pushInstanceType() {
  let v = instanceSize.map(row => '(' + row.map(el => `'${el}'`).join(',') + ')').join(',');
  let q = `INSERT INTO instanceSize (size, factor) VALUES ${v};`
  return q;
}

function pushToDB(session, data) {
  return new Promise(function(resolve, reject) {
    let ins = [];
    while (data.length != 0) {
      let buf = [];
      while (data.length != 0 && buf.length < 900) {
        buf.push(data.shift());
      }
      let v = buf.map((el) => `(${el})`).join(',');
      let q = `INSERT INTO awsri (aws_id, month, purchase_type, size, region, instance_type, cost, hour) VALUES ${v};`
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
    Metrics: ['UsageQuantity', 'UnblendedCost'],
    GroupBy: [
      {
        Type: 'DIMENSION',
        Key: 'REGION',
      },
      {
        Type: 'DIMENSION',
        Key: 'INSTANCE_TYPE',
      }
    ],
  }

  var rows = [];
  function pushData(aws_id, purchaseType, data) {
    data.ResultsByTime.forEach((month) => {
      month.Groups.forEach(row => {
        // console.log();
        // process.exit();
        let size = row['Keys'][1].split('.')[1];
        let csv = [aws_id, month.TimePeriod.Start, purchaseType, size, ...row.Keys, row.Metrics.UnblendedCost.Amount, row.Metrics.UsageQuantity.Amount].map((el) => `'${el}'`);
        rows.push(csv)
      });
    });
  }

  function queryAws(aws_id, purchaseType) {
    return new Promise(function(resolve, reject) {
      console.log('Proccess: ' + aws_id + purchaseType)
      var aws_cred = JSON.parse(fs.readFileSync(`../work_in_XO/secrets/${aws_id}.json`));
      AWS.config.update({ accessKeyId: aws_cred['AccessKeyId'], secretAccessKey: aws_cred['SecretAccessKey'], region: 'us-east-1' });
      var costexplorer = new AWS.CostExplorer();
      params.Filter.And[0].Dimensions.Values = [purchaseType];
      costexplorer.getCostAndUsage(params, function (err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else {
          // let output = JSON.stringify(data);
          // console.log(output);
          pushData(aws_id, purchaseType, data);
          pushToDB(session, rows).then(() => resolve());
        }
      });
    });
  }

  queryAws('428226229991', 'On Demand Instances')
    // .then(() => queryAws('428226229991', 'Standard Reserved Instances'))
    // .then(() => queryAws('540235812892', 'On Demand Instances'))
    // .then(() => queryAws('540235812892', 'Standard Reserved Instances'))
    // .then(() => queryAws('157147590138', 'On Demand Instances'))
    // .then(() => queryAws('157147590138', 'Standard Reserved Instances'))
    .then(() => {
      // fs.writeFileSync('log/tmp/ri.json', JSON.stringify(rows));
      resolve(rows);
    });
  });
}

console.log('Data loaded');

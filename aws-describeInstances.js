const fs = require('fs');
const AWS = require('aws-sdk');

var config = new (require('./config').config)();

let aws_id = '956186766273';
// let aws_id = '428226229991';
// ssh root@ec2-34-227-24-36.compute-1.amazonaws.com -i valentin-gulyaev-ey.pem -L 16003:localhost:3306
// ssh root@ec2-34-205-75-144.compute-1.amazonaws.com -i valentin-gulyaev-ey.pem -L 16003:localhost:5432
// deploy
// 5Fd6io7O6L

let aws_cred = JSON.parse(fs.readFileSync(`../work_in_XO/secrets/${aws_id}.json`));

rejectedRegion = ['cn-north-1', 'cn-northwest-1', 'ap-northeast-3'];
regions = ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'ap-south-1', 'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ca-central-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-north-1', 'sa-east-1'];

AWS.config.update({ accessKeyId: aws_cred['AccessKeyId'], secretAccessKey: aws_cred['SecretAccessKey']});

let rows = [];

function tag(theArray, tagName) {
  let a = theArray.filter(el => el.Key == tagName);
  if (0 == a.length) {
    return undefined;
  } else {
    return a[0].Value;
  }
}

function parseData(region, data) {
  data.Reservations.forEach((el) => {
    el.Instances.forEach((el) => {
      let row = [region, el.InstanceId, el.InstanceType, el.LaunchTime, el.PublicIpAddress, el.State.Name, tag(el.Tags, 'Name')];
      rows.push(row);
      console.log(row.join(','));
    });
  });
}

Promise.all(
regions.map((region) => {
  return new Promise(function(resolve, reject) {
    var ec2 = new AWS.EC2({region: region});
    ec2.describeInstances({}, function(err, data) {
      if (err) {
        // console.log(region);
        console.log(err, err.stack); // an error occurred
      } else {
        // console.log(JSON.stringify(data));
        parseData(region, data);
        resolve();
      }
    });
  });
}))
.then(() => {
  let fileReport = 'dfdff';
  fs.writeFileSync(fileReport, JSON.stringify({
    generatedAt: (new Date).toISOString(),
    header: ['region', 'InstanceId', 'InstanceType', 'LaunchTime', 'PublicIp', 'State', 'Name'],
    result: rows}, null, config.JSONspace));
  console.log('Done!');
});

// var d = JSON.parse(fs.readFileSync('./log/tmp/instances.json'));
// parseData(d);

const fs = require('fs');
var jwt = require('jsonwebtoken');

var msg = JSON.parse(fs.readFileSync('msg.json'));
// console.log(msg);
console.log(msg.constructor.name)
var token = jwt.sign(msg, '28061984');

fs.writeFileSync('../log/tmp/msg.jwt', token);
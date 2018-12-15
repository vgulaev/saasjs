const { execSync } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');
const { compile } = require('./htmljs')
var saasjs;

// var cach = false;
// async function recompile(filename) {
//   if (cach) return;
//   cach = true;
//   console.log("begin Cach ==== " + cach);
//   await compile(`content/htmljs/source/${filename}`);
//   cach = false;
//   console.log("start Cach ==== " + cach);
// }

fs.watch('./content/htmljs/source', { encoding: 'utf-8' }, (eventType, filename) => {
  if (filename) {
    console.log(`${filename} is changed will recompile`);
    compile(`content/htmljs/source/${filename}`);
  }
});

function stop() {
  saasjs.kill();
  // var result = execSync('kill -9 "$(< log/saasjs.pid)"');
}

function start() {
  saasjs = spawn('node', ['saas.js']);

  saasjs.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  saasjs.stderr.on('data', (data) => {
    console.log(data.toString());
  });
  // var result = execSync('node saas.js && echo $! > log/saasjs.pid');
}

fs.watch('./', { encoding: 'utf-8' }, (eventType, filename) => {
  if (filename) {
    console.log(`${filename} is changed will restart`);
    stop();
    start();
  }
});

start();

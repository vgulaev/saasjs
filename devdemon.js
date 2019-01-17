const { execSync } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs');
const { compile } = require('./htmljs')
const { compileAll } = require('./htmljs')
var saasjs;

compileAll();

fs.watch('./content/htmljs/source', { encoding: 'utf-8' }, (eventType, filename) => {
  if (filename) {
    console.log(`${filename} is changed will recompile`);
    compile(`content/htmljs/source/${filename}`);
  }
});

function stop() {
  saasjs.kill();
}

function start() {
  saasjs = spawn('node', ['saas.js']);

  saasjs.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  saasjs.stderr.on('data', (data) => {
    console.log(data.toString());
  });
}

fs.watch('./', { encoding: 'utf-8' }, (eventType, filename) => {
  if (filename) {
    console.log(`${filename} is changed will restart`);
    stop();
    start();
  }
});

start();

const fs = require('fs');
const { execSync } = require('child_process');

['log/pid.log', 'log/monit.pid'].forEach(filename => {
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename, 'xxx\n');
  }
});

function checkAndRun() {
  let pid = fs.readFileSync('log/saasjs.pid', 'utf-8').trim();
  try {
    let res = execSync(`ps aux | grep [${pid[0]}]${pid.substring(1)}`).toString();
  } catch (e) {
    let res = execSync('./saasjs-run');
    fs.appendFileSync('log/pid.log', `${(new Date).toISOString()}: restarted\n`);
  }

  setTimeout(checkAndRun, 2000);
}

let pid = fs.readFileSync('log/monit.pid', 'utf-8').trim();

try {
  let res = execSync(`ps aux | grep [${pid[0]}]${pid.substring(1)}`).toString();
  console.log('monit already run');
} catch (e) {
  console.log('run checkAndRun');
  fs.writeFileSync('log/monit.pid', process.pid);
  checkAndRun();
}

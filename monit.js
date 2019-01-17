const fs = require('fs');
const { execSync } = require('child_process');

if (!fs.existsSync('log/pid.log')) {
  fs.writeFileSync('log/pid.log', '');
}

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

checkAndRun();
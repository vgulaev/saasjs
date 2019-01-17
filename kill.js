const fs = require('fs');
const { execSync } = require('child_process');

exports.kill = function (filename) {
  let pid = fs.readFileSync(filename, 'utf-8').trim();
  try {
    res = execSync(`kill -9 ${pid}`);
    console.log('Old process is terminated');
  } catch (error) {
  }
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    exports.kill('log/saasjs.pid');
  }
}

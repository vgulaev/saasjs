const fs = require('fs');
const { execSync } = require('child_process');

let pid = fs.readFileSync('log/saasjs.pid', 'utf-8').trim();

try {
  res = execSync(`kill -9 ${pid}`);
  console.log('Old process is terminated');
} catch (error) {
}

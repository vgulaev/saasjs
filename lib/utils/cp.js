const { execSync } = require('child_process');

var config = new (require('../../config').config)();

function cp(filename) {
  let cmd = `scp -i ${config.sshProd} ${config.rootPath}${filename} ubuntu@${config.prod.IP}:/data/${filename}`;
  let res = execSync(cmd);
  console.log(res.toString());
}

if (process.argv.length == 3) {
  cp(process.argv[2]);
}

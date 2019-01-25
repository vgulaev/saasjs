const { execSync } = require('child_process');

var config = new (require('../../config').config)();

exports.cp = function (filename, to) {
  let cmd = `scp -i ${config.sshProd} ${config.rootPath}${filename} ubuntu@${config.prod.IP}:/data/${undefined == to ? filename : to}`;
  let res = execSync(cmd);
  console.log(res.toString());
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    if (process.argv.length == 3) {
      exports.cp(process.argv[2]);
    }
  }
}

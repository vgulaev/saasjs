const { execSync } = require('child_process');

function remote(cmd) {
  res = execSync(`ssh eycost-db '${cmd}'`);
  console.log(res.toString());
}

remote('cd /data/saasjs && ./saasjs-pull');
remote("cd /data/work_in_XO && ssh-agent bash -c 'ssh-add secrets/workXO.pem; git pull'");
remote('cd /data/saasjs && ./saasjs-monit');

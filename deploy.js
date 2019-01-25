const { execSync } = require('child_process');
const { cp } = require('./lib/utils/cp');

var config = new (require('./config').config)();

// old - 35.172.224.44
// new - 34.237.144.227
// i-08fb702af0031be3f
function remote(cmd, quotes = "'") {
  res = execSync(`ssh eycost-db ${quotes}${cmd}${quotes}`);
  console.log(res.toString());
}

function first() {
  // remote('curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -');
  // remote('sudo apt-get install -y nodejs');
  // remote('wget https://dev.mysql.com/get/mysql-apt-config_0.8.12-1_all.deb');
  // should manualy install cause def is mysql 5, should be mysql 8
  // remote('sudo dpkg -i mysql-apt-config_0.8.12-1_all.deb');
  // remote('sudo apt-get update');
  // remote('sudo apt-get install -y mysql-server');
  let u = config['mysqlxCred']['user'];
  let p = config['mysqlxCred']['password'];
  // remote(`sudo mysql -e \\"CREATE USER '${u}'@'localhost' IDENTIFIED BY '${p}'\\"`, '"');
  // remote(`sudo mysql -e \\"GRANT ALL PRIVILEGES ON *.* TO '${u}'@'localhost' WITH GRANT OPTION;\\"`, '"');
  // remote('sudo mysql -e "CREATE DATABASE eycost"');
  // remote('sudo mkdir /data');
  // remote('sudo chmod 777 /data');
  // cp('saasjs/config/saasjs.pem', '');
  // cp('work_in_XO/secrets/workXO.pem', '');
  // remote("cd /data && ssh-add saasjs.pem && git clone git@github.com:vgulaev/saasjs.git");
  // remote("cd /data && ssh-add workXO.pem && git clone git@github.com:vgulaev/work_in_XO.git");
  // remote("mv /data/saasjs.pem /data/saasjs/config");
  // remote("mv /data/workXO.pem /data/work_in_XO/secrets");
  // remote('cd /data/saasjs && npm install');
  // cp('work_in_XO/secrets/ad_login.json');
  // cp('work_in_XO/secrets/157147590138.json');
  // cp('work_in_XO/secrets/428226229991.json');
  // cp('work_in_XO/secrets/540235812892.json');
  // cp('work_in_XO/secrets/mysql_cred.json');
  // remote('sudo apt-get install -y ruby');
}

function deploy() {
  // console.log('deploy');
  // return;
  remote('cd /data/saasjs && git reset HEAD --hard && git clean -f');
  remote('cd /data/saasjs && ./saasjs-pull');
  remote("cd /data/work_in_XO && ssh-agent bash -c 'ssh-add secrets/workXO.pem; git pull'");
  remote('cd /data/saasjs && ./saasjs-monit');
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    if (-1 == ['first'].indexOf(process.argv[2])) {
      // first();
      deploy();
    } else {
      first();
    }
  }
}

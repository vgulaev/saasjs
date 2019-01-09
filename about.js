const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.stat = function () {
  let list = execSync('git ls-tree --full-tree -r --name-only HEAD')
    .toString()
    .split('\n').filter(el => el != '');
  let ss = {};

  list.forEach(el => {
    let parsed = path.parse(el);
    if (parsed['ext'] in ss) {
      ss[parsed['ext']].count += 1;
      ss[parsed['ext']].line += fs.readFileSync(el, 'utf-8').split('\n').length;
      ss[parsed['ext']].size += fs.statSync(el)["size"];
    } else {
      ss[parsed['ext']] = {
        count: 1,
        line: parsed['ext'] == '.ico' ? 0 : (fs.readFileSync(el, 'utf-8').split('\n').length),
        size: fs.statSync(el)["size"]
      };
    }
  });

  return Object.keys(ss).map(el => [el, ss[el]]).sort((a, b) => b[1].line - a[1].line );
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    console.log(exports.stat());
  }
}

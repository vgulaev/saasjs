const fs = require('fs');
const path = require('path');

exports.compile = function (filename) {
  var parsed = path.parse(filename);
  var fileout = filename.replace('.htmljs', '.html.js').replace('/source/', '/compiled/');

  function append(msg) {
    fs.appendFileSync(fileout, msg);
  }

  fs.writeFileSync(fileout, '');
  append(`exports.build = function (res, data) { \nreturn new Promise(function (resolve, reject) {\nvar content = "";\n`);

  var content = fs.readFileSync(filename, 'utf-8');
  var customResolve = false;
  content.split('\n').map(function (line) {
      var newline = line;
      if ("<" == line.trim()[0]) {
        newline = "content +=`" + line + "\\n`;"
      }
      if (newline.indexOf('resolve(') != -1) {
        customResolve = true;
      }
      append(newline + "\n");
    });

  if (!customResolve) {
    append('resolve(content);\n');
  }
  append('});\n}\n');
}

function compileAll() {
  var rootPath = 'content/htmljs/source';
  fs.readdir(rootPath, function(err, items) {
    items.forEach(function (item) {
      console.log('compile ' + `${rootPath}/${item}`);
      exports.compile(`${rootPath}/${item}`);
    });
  });
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    compileAll();
  }
}

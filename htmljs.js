const fs = require('fs');
// const path = require('path');

function compile(filename) {
  // var data = path.parse(filename);
  var fileout = filename.replace('.htmljs', '.html.js').replace('/source/', '/compiled/');

  // console.log(fileout);
  // return 0;

  function append(msg) {
    fs.appendFileSync(fileout, msg);
  }

  fs.writeFileSync(fileout, '');
  append('function build(req) { \nvar res = "";\n');

  var lineReader = require('readline').createInterface({
    input: fs.createReadStream(filename)
  });

  lineReader.on('line', function (line) {
    var newline = line;
    if ("<" == line.trim()[0]) {
      newline = "res +=`" + line + "\\n`;"
    }
    append(newline + "\n");
    console.log('Line from file:', line);
  });

  lineReader.on('close', function () {
    append('return res;\n');
    append('}\n');
    append('\nconsole.log(build(1));\n');
  });
  console.log('Hello!!!');
}

compile('content/htmljs/source/index.htmljs');

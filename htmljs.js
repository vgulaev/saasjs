const fs = require('fs');
const path = require('path');

exports.compile = function (filename) {
  var parsed = path.parse(filename);
  // console.log(parsed);
  var fileout = filename.replace('.htmljs', '.html.js').replace('/source/', '/compiled/');

  function append(msg) {
    fs.appendFileSync(fileout, msg);
  }

  fs.writeFileSync(fileout, '');
  // ${parsed["name"]
  append(`exports.build = function (res, data) { \nvar content = "";\n`);

  var content = fs.readFileSync(filename, 'utf-8');
  content.split('\n').map(function (line) {
      var newline = line;
      if ("<" == line.trim()[0]) {
        newline = "content +=`" + line + "\\n`;"
      }
      append(newline + "\n");
    });

  append('return content;\n');
  append('}\n');
  // var lineReader = require('readline').createInterface({
  //   input: fs.createReadStream(filename)
  // });

  // lineReader.on('line', function (line) {
  //   // console.log('Line from file:', line);
  // });

  // lineReader.on('close', function () {
  //   append('return res;\n');
  //   append('}\n');
  //   // append('\nconsole.log(build(1));\n');
  // });
}

// exports.compile('content/htmljs/source/index.htmljs');

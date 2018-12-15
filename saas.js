const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');


function empty_res(res) {
  res.writeHead(404, {
    'Content-Type': "text/plain; charset=UTF-8"
  });
  res.end("Something going wrong");
}

function log(msg) {
  console.log(msg);
}

function debug(res, msg) {
  res.writeHead(200, {
    'Content-Type': "text/plain; charset=UTF-8"
  });
  res.end(msg);
}

function memo_type(type) {
  var types = {
    '.htmljs': 'text/html; charset=UTF-8',
    '.ico': 'image/x-icon',
    '.js': 'application/javascript'
  };
  if (type in types) {
    return types[type];
  } else {
    return 'text/plain; charset=UTF-8';
  }
}

function respond(req, res) {
  var myURL = url.parse(req.url);
  var pathname = myURL["pathname"];
  if ('/' == pathname) {
    pathname = '/index.htmljs'
  }

  var parsed = path.parse(pathname);

  if (req.method === 'POST') {
  } else if (req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': memo_type(parsed['ext'])
    });
    var content = "";
    if ('.htmljs' == parsed['ext']) {
      content = require(`./content/htmljs/compiled/${parsed["name"]}.html`).build(res);
    } else if ('.js' == parsed['ext']) {
      content = fs.readFileSync(`content/js/${parsed["base"]}`);
    } else if ('.ico' == parsed['ext']) {
      content = fs.readFileSync(`content/img/${parsed["base"]}`);
    }
    res.end(content);
  } else {
    res.end("Hello word!!!");
  }
};

const server = http.createServer((req, res) => {
  log(req.url);
  try {
    respond(req, res);
  } catch (err) {
    console.log(err)
    empty_res(res);
  }
});

server.listen(2806, '0.0.0.0', () => {
  console.log(`Сервер запущен port: 2806`);
});

const http = require('http');
const url = require('url');
const path = require('path');

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

function respond(req, res) {
  var myURL = url.parse(req.url);
  var pathname = myURL["pathname"];
  if ('/' == pathname) {
    pathname = '/index.htmljs'
  }

  var parsed = path.parse(pathname);

  console.log(parsed);

  res.writeHead(200, {
    'Content-Type': "text/plain; charset=UTF-8"
  });


  if (req.method === 'POST') {
  } else if (req.method === 'GET') {
    require(`./content/htmljs/`)
    res.end("Hello word!!!");
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

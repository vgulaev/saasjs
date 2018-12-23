const http = require('http');
const https = require('https');
const url = require('url');
const path = require('path');
const fs = require('fs');

const db = new (require('./easy-db').db)();
var config = new (require('./config').config)();
var env = {
  rootpath: __dirname,
  db: db,
  semaphore: {}
};

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

function static(req, res) {
  res.writeHead(200, {
    'Content-Type': memo_type(env.parsed['ext'])
  });
  var content = '';
  if ('.htmljs' == env.parsed['ext']) {
    var filename = `./content/htmljs/compiled/${env.parsed['name']}.html`;
    var data = {env: env};
    _require(filename).build(res, data).then(function (content) {
      res.end(content);
    });
  } else {
    if ('.js' == env.parsed['ext']) {
      content = fs.readFileSync(`content/js/${env.parsed['base']}`);
    } else if ('.ico' == env.parsed['ext']) {
      content = fs.readFileSync(`content/img/${env.parsed['base']}`);
    } else if ('.srv' == env.parsed['ext']) {
    } else {
      content = 'Strange things happens';
    }
    res.end(content);
  }
}

function _require(filename) {
  delete require.cache[require.resolve(filename)];
  return require(filename)
}

function setSessionId(req, res) {
  var sessionId = req.headers.cookie;
  if (sessionId == undefined) return;
  if (req.headers.cookie.length > 32) {
    if (sessionId.indexOf('s=') != -1) {
      sessionId = sessionId.replace('s=', '');
      if (sessionId in db.data.session) {
        res.sessionId = sessionId;
      }
    }
  }
}

function respond(req, res) {
  var myURL = url.parse(req.url);
  var pathname = myURL['pathname'];
  if ('/' == pathname) {
    pathname = '/index.htmljs'
  }

  setSessionId(req, res);

  env.parsed = path.parse(pathname);

  if (req.method === 'POST') {
  } else if (req.method === 'GET') {
    if ('oauthcallback' == env.parsed['name']) {
      require('./custom-oauth').oauthcallback(myURL, res, env);
    } else if ('weekly-cost-data' == env.parsed['name']) {
      _require('./weekly-cost-data').report(res);
    } else {
      static(req, res);
    }
  } else {
    res.end("Hello word!!!");
  }
};

const server = http.createServer((req, res) => {
  log(`${req.method} :: ${req.url}`);
  try {
    respond(req, res);
  } catch (err) {
    console.log(err)
    empty_res(res);
  }
});

function init() {
  if (undefined == db.data.session) {
    db.data.session = {};
  }
}

init();

server.listen(2806, '0.0.0.0', () => {
  console.log(`Сервер запущен port: 2806`);
});

const fs        = require('fs');
const http      = require('http');
const https     = require('https');
const path      = require('path');
const url       = require('url');
const {isRoot}  = require('./is-root')

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
    '.css': 'text/css',
    '.html': 'text/html; charset=UTF-8',
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

function jarvisMsg(res) {
  res.writeHead(200, {
    'Content-Type': memo_type()
  });
  res.end(fs.readFileSync('Jarvis/msg.json'));
}

function static(req, res) {
  let head = {'Content-Type': memo_type(res.c.parsed['ext'])};
  var content = '';
  if ('.htmljs' == res.c.parsed['ext']) {
    var filename = `./content/htmljs/compiled/${res.c.parsed['name']}.html`;
    var data = {env: env};
    _require(filename).build(res, data).then(function (content) {
      res.writeHead(200, head);
      res.end(content);
    });
  } else {
    res.writeHead(200, head);
    if ('.js' == res.c.parsed['ext']) {
      content = fs.readFileSync(`content/js/${res.c.parsed['base']}`);
    } else if ('.html' == res.c.parsed['ext']) {
      content = fs.readFileSync(`content/html/${res.c.parsed['base']}`);
    } else if ('.ico' == res.c.parsed['ext']) {
      content = fs.readFileSync(`content/img/${res.c.parsed['base']}`);
    } else if ('.css' == res.c.parsed['ext']) {
      content = fs.readFileSync(`content/css/${res.c.parsed['base']}`);
    } else {
      content = 'Strange things happens';
    }
    res.end(content);
  }
}

function service(req, res) {
  if ([
    'cost-data-weekly',
    'cost-data-staging',
    'cost-data-account',
    'jira'
  ].indexOf(res.c.parsed['name']) != -1) {
    _require(`./${res.c.parsed['name']}`).route(res);
  } else if ('jarvis-msg' == res.c.parsed['name']) {
    jarvisMsg(res);
  } else {
    empty_res(res);
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
    var s = sessionId.indexOf('s=');
    if (s != -1) {
      sessionId = sessionId.substring(s + 2, s + 38);
      if (sessionId in db.data.session) {
        res.sessionId = sessionId;
      }
    }
  }
}

function setGzipStatus(req, res) {
  let status = req.headers['accept-encoding'];
  res.applyGzip = false;
  if (undefined != status) {
    if (status.indexOf('gzip') > -1) {
      res.applyGzip = true;
    }
  }
}

function getBody(req) {
  return new Promise(function (resolve, reject) {
    let body = [];
    req.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      resolve(body);
    });
  });
}

function respond(req, res) {
  res.c = {} // custom hash for fast and short access to req values
  res.c.url = req.url;
  res.c.urlParsed = url.parse(req.url);

  var pathname = res.c.urlParsed['pathname'];
  if ('/' == pathname) {
    pathname = '/index.htmljs'
  }
  res.c.parsed = path.parse(pathname);
  res.c.env = env;
  setSessionId(req, res);
  setGzipStatus(req, res);

  if (req.method === 'POST') {
    if (('access' == res.c.parsed['name']) && isRoot(res)) {
      getBody(req)
        .then((data) => _require('./access').post(res, data));
    } else if ('sql-console' == res.c.parsed['name']){
      getBody(req)
        .then((data) => _require('./sql-console').post(res, data));
    } else {
      empty_res(res);
    }
  } else if (req.method === 'GET') {
    if ('oauthcallback' == res.c.parsed['name']) {
      require('./custom-oauth').oauthcallback(res.c.urlParsed, res, env);
    } else if ('.srv' == res.c.parsed['ext']) {
      service(req, res);
    } else {
      static(req, res);
    }
  } else {
    empty_res(res);
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

var port = 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен port: ${port}`);
});

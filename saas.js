const http = require('http');

function empty_res(res) {
  res.writeHead(404, {
    'Content-Type': "text/plain; charset=UTF-8"
  });
  res.end("Something going wrong");
}

function log(msg) {
  console.log(msg);
}

function respond(req, res) {
  var url = req.url;
  if ('/' == req.url) {
    url = '/index.html'
  }

  res.writeHead(200, {
    'Content-Type': "text/plain; charset=UTF-8"
  });



  if (req.method === 'POST') {
  } else if (req.method === 'GET') {
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

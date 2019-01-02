const zlib = require('zlib');

exports.sendJSON = function(res, data) {
  let head = {'Content-Type': 'application/json'};
  if (res.applyGzip) {
    head['content-encoding'] = 'gzip';
    res.writeHead(200, head);
    const buf = new Buffer(JSON.stringify(data), 'utf-8');
    zlib.gzip(buf, function (_, result) {
      res.end(result);
    });
  } else {
    res.writeHead(200, head);
    res.end(JSON.stringify(data));
  }
}

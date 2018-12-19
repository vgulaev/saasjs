const https = require('https');
const url = require('url');
var jwt = require('jsonwebtoken');

var config = new (require('./config').config)();

exports.oauthcallback = function (myURL, res, env) {
  var params = new url.URLSearchParams(myURL['query']);
  var post_data = new url.URLSearchParams();
  post_data.set('code', params.get('code'));
  post_data.set('client_id', config['oauth2']['client_id']);
  post_data.set('client_secret', config['oauth2']['client_secret']);
  post_data.set('redirect_uri', config['oauth2']['redirect_uri']);
  post_data.set('grant_type', 'authorization_code');

  var buf = Buffer.from(post_data.toString(), 'utf8')

  var post_options = {
    host: 'oauth2.googleapis.com',
    port: '443',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(buf)
    }
  };

  var post_req = https.request(post_options, function(_res) {
    _res.setEncoding('utf8');
    var data = "";
    _res.on('data', function (chunk) {
      data += chunk;
    }).on('end', () => {
      var parsed = JSON.parse(data);
      var decoded = jwt.decode(parsed['id_token']);
      env.email = decoded['email'];
      res.writeHead(302, {
        'Location': 'index.htmljs'
      });
      res.end();
    });
  });

  post_req.write(buf);
  post_req.end();
}

const https = require('https');
const url = require('url');
const jwt = require('jsonwebtoken');
const uuidv4 = require('uuid/v4');
const fs = require('fs');

var config = new (require('./config').config)();
var allowedEmail = JSON.parse(fs.readFileSync('config/authorized.json'));

exports.oauthlink = function () {
  return ['https://accounts.google.com/o/oauth2/v2/auth?',
 `client_id=${config['oauth2']['client_id']}&`,
 'response_type=code&',
 'scope=openid%20email&',
 `redirect_uri=${config['oauth2']['redirect_uri']}&`,
 //'state=security_token%3D138r5719ru3e1%26url%3Dhttps://oauth2-login-demo.example.com/myHome&',
 // 'login_hint=jsmith@example.com&',
 //'openid.realm=example.com&',
 'nonce=0394852-3190485-2490358&'].join('');
}

exports.oauthcallback = function (myURL, res, env) {
  var db = env.db;
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
      var expires = new Date;
      var parsed = JSON.parse(data);
      var decoded = jwt.decode(parsed['id_token']);
      if (decoded['email'] in allowedEmail != -1) {
        var sessionId = uuidv4();
        db.data.session[sessionId] = {
          email: decoded['email'],
          created_at: expires.toISOString(),
          role: allowedEmail[decoded['email']].role
        };
        db.save();
        expires.setDate(expires.getDate() + 30);
        res.writeHead(302, {
          'Location': 'index.htmljs',
          'Set-Cookie': `s=${sessionId}; expires=${expires.toGMTString()}`
        });
        res.end();
      } else {
        res.writeHead(302, {
          'Location': 'unauthorized.htmljs',
        });
        res.end();
      }
    });
  });

  post_req.write(buf);
  post_req.end();
}

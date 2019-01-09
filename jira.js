const fs = require('fs');
const https = require('https');
const {sendJSON} = require('./sendJSON');

var Client = require('node-rest-client').Client;
var adCred = JSON.parse(fs.readFileSync(`../work_in_XO/secrets/ad_login.json`));

function getJiraLogin(username, password) {
  return new Promise(function (resolve, reject) {
    client = new Client();
    var loginArgs = {
      data: {
        'username': username,
        'password': password
      },
      headers: {
        'Content-Type': 'application/json'
      }
    };
    client.post('https://jira.devfactory.com/rest/auth/1/session', loginArgs, function(data, response) {
      if (response.statusCode == 200) {
        var session = data.session;
        resolve(session.name + '=' + session.value);
      } else {
        throw 'Login failed :(';
      }
    });
  });
}

function getDataFromJira() {
  getJiraLogin(adCred.username, adCred.password)
    .then((session) => {
      var searchArgs = {
        headers: {
          // Set the cookie from the session information
          cookie: session,
          'Content-Type': 'application/json'
        },
        data: {
          fields: ['assignee', 'updated', 'summary'], //,issuetype,project,,reporter,created,resolutiondate,updated,summary,status",
          jql: 'resolution = Unresolved and project in ("EY.Core -EngineYard Cloud Paas") and type in ("Change Request") ORDER BY updated DESC'
        }
      };
      client.post('https://jira.devfactory.com/rest/api/2/search', searchArgs, function(searchResult, response) {
        console.log('status code:', response.statusCode);
        if (searchResult instanceof Buffer) {
          console.log('search result:', searchResult.toString());
        } else {
          fs.writeFileSync('log/tmp/jiraCr.json', JSON.stringify(searchResult));
          console.log(JSON.stringify(searchResult));
        }
      });
    });
}

exports.route = function(res) {
  if (undefined == res.sessionId) {
    res.writeHead(302, {
      'Location': 'unauthorized.htmljs',
    });
    res.end();
    return;
  }
  let q = res.c.urlParsed['query'];
  if (undefined == q) {
    sendJSON(res, data = {status: 'Should use any account filter'});
  } else if ("cr" == q) {
    sendJSON(res, {status: 'ok', data: JSON.parse(fs.readFileSync('log/tmp/jiraCr.json'))});
  }
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    getDataFromJira();
  }
}

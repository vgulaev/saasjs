const fs = require('fs');
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

function requestData(session, jql, filename) {
  var searchArgs = {
    headers: {
      // Set the cookie from the session information
      cookie: session,
      'Content-Type': 'application/json'
    },
    data: {
      fields: ['assignee', 'updated', 'summary'], //,issuetype,project,,reporter,created,resolutiondate,updated,summary,status",
      jql: jql
    }
  };
  client.post('https://jira.devfactory.com/rest/api/2/search', searchArgs, function(searchResult, response) {
    console.log('status code:', response.statusCode);
    if (searchResult instanceof Buffer) {
      console.log('search result:', searchResult.toString());
    } else {
      fs.writeFileSync(`log/tmp/${filename}`, JSON.stringify(searchResult));
      console.log(JSON.stringify(searchResult));
    }
  });
}

exports.getDataFromJira = function () {
  getJiraLogin(adCred.username, adCred.password)
    .then((session) => {
      requestData(session, 'resolution = Unresolved and project in ("EY.Core -EngineYard Cloud Paas") and type in ("Change Request") ORDER BY updated DESC', 'jiraCr.json');
      requestData(session, 'resolution = Unresolved and project in ("EY.Core -EngineYard Cloud Paas") and type in ("SaaS Internal", "SaaS Request") ORDER BY updated DESC', 'jiraSaaS.json');
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
    sendJSON(res, data = {status: 'Should use any filter'});
  } else if ("cr" == q) {
    sendJSON(res, {status: 'ok', data: JSON.parse(fs.readFileSync('log/tmp/jiraCr.json'))});
  } else if ("saas" == q) {
    sendJSON(res, {status: 'ok', data: JSON.parse(fs.readFileSync('log/tmp/jiraSaaS.json'))});
  }
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    exports.getDataFromJira();
  }
}

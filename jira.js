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
  return new Promise(function(resolve, reject) {
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
      console.log('request:', filename, ' status code:', response.statusCode);
      if (searchResult instanceof Buffer) {
        resolve(0);
      } else {
        fs.writeFileSync(`log/tmp/${filename}`, JSON.stringify(searchResult));
        resolve(1);
      }
    });
  });
}

exports.getDataFromJira = function () {
  getJiraLogin(adCred.username, adCred.password)
    .then((session) => {
      let status = [];
      requestData(session, 'resolution = Unresolved and project in ("EY.Core -EngineYard Cloud Paas") and type in ("Change Request") ORDER BY updated DESC', 'jira-cr.json')
        .then(res => {
          status.push(res);
          return requestData(session, 'resolution = Unresolved and project in ("EY.Core -EngineYard Cloud Paas") and type in ("SaaS Internal", "SaaS Request") ORDER BY updated DESC', 'jira-saas.json');
        })
        .then(res => {
          status.push(res);
          let d = new Date;
          d.setDate(d.getDate() - 6 - d.getDay());
          return requestData(session, `type in ("Change Request", "SaaS Request", "SaaS Internal") AND resolution = Done  AND project in ("EY.Core -EngineYard Cloud Paas") and resolved >= "${d.toISOString().substring(0, 10)}" ORDER BY updated`, 'jira-done.json');
        })
        .then(res => {
          status.push(res);
          for (el of status) {
            if (0 == el) {
              console.log('Some request fail');
              break;
            }
          }
        });
    });
}

exports.route = function(res) {
  let q = res.c.urlParsed['query'];
  if (undefined == q) {
    sendJSON(res, data = {status: 'Should use any filter'});
  } else if (-1 != ['cr', 'saas', 'done'].indexOf(q)) {
    sendJSON(res, {status: 'ok', data: JSON.parse(fs.readFileSync(`log/tmp/jira-${q}.json`))});
  }
}

if (process.argv.length > 1) {
  if (__filename == process.argv[1]) {
    exports.getDataFromJira();
  }
}

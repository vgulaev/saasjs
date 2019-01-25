const mysqlx = require('@mysql/xdevapi');

var config = new (require('../../config').config)();

let queries = [
'USE eycost',
'DROP TABLE IF EXISTS sqlquery',
`CREATE TABLE sqlquery (
id int(11) NOT NULL AUTO_INCREMENT,
name varchar(100) DEFAULT NULL,
source varchar(100) DEFAULT NULL,
query text DEFAULT NULL,
PRIMARY KEY (id)
)`];

function* queue() {
  for (e of queries) {
    yield e;
  }
}

function query(session, query) {
  return new Promise(function(resolve, reject) {
    session.sql(query)
      .execute(result => {
        console.log(result);
      })
      .then(() => resolve());
  });
}

mysqlx
  .getSession(config.mysqlxCred)
  .then(session => {
    let q = queue();
    let p = Promise.resolve();
    for (let i = 0; i < queries.length; i++) {
      p = p.then(() => query(session, q.next().value));
    }
    p.then(() => session.close());
  });

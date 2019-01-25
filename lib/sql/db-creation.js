const mysqlx = require('@mysql/xdevapi');

var config = new (require('../../config').config)();
// const db = require('../../easy-db');

let queries = [`
CREATE TABLE sqlquery (
id int(11) NOT NULL AUTO_INCREMENT,
name varchar(100) DEFAULT NULL,
query text DEFAULT NULL,
PRIMARY KEY (id)
)`];

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
    query(session, "USE eycost")
      .then(() => query(session, "DROP TABLE IF EXISTS sqlquery"))
      .then(() => query(session, queries[0]))
      .then(() => session.close());
    });


// let queries = [`
// select * from eycost.dailycost limit 1`];


// exports.perform = function () {
//   queries.forEach((q) => {
//     db.query(q)
//       .then(() => {
//         console.log('Done');
//       });
//   });
// }

// if (process.argv.length > 1) {
//   if (__filename == process.argv[1]) {
//     exports.perform();
//   }
// }

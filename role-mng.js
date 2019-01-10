exports.isRoot = function(res) {
  let result = false;
  try {
    result = (-1 != res.c.env.db.data.session[res.sessionId].email.indexOf('valentin'));
  } catch(error) {
  }
  return result;
}

exports.role = function(res) {
  let result = undefined;
  try {
    result = res.c.env.db.data.session[res.sessionId].role;
  } catch(error) {
  }
  return result;
}

exports.email = function(res) {
  let result = undefined;
  try {
    result = res.c.env.db.data.session[res.sessionId].email;
  } catch(error) {
  }
  return result;
}

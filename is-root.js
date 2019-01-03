exports.isRoot = function(res) {
  let result = false;
  try {
    result = (-1 != res.c.env.db.data.session[res.sessionId].email.indexOf('valentin'));
  } catch(error) {
  }
  return result;
}

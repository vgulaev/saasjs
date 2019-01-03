exports.semaphorOpen = function(res, name, minutes) {
  let s = res.c.env.semaphore;
  let result = true;
  if (undefined != s[name]) {
    let d = new Date;
    result = ((d - s[name]) > minutes * 60 * 1000);
  }
  return result;
}

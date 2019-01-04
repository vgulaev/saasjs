function httpGetAsync(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous
    xmlHttp.send(null);
}

function httpPostAsync(theUrl, data) {
  return new Promise(function (resolve, reject) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onload = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
            resolve(xmlHttp.responseText);
        } else {
          reject();
        }
    };
    xmlHttp.open("POST", theUrl, true); // true for asynchronous
    xmlHttp.send(data);
  });
}

function wrap(tag, context, option) {
  var head = [tag];
  if (undefined != option) {
    if ('style' in option) {
      head.push(`style="${option['style']}"`);
    }
  }
  return `<${head.join(' ')}>${context}</${tag}>`
}

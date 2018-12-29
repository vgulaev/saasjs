var form = [];
var s;

function scan() {
  document.addEventListener('keypress', (event) => {
    if ('' == scanText.value) {
      s = performance.now();
      form = [];
    }
    const keyName = event.key;
    form.push({key: keyName, time: performance.now() - s});
    // var msg = 'Hello! I\'m Jarvis!';
    // var msg = 'Я чуть-чуть пишу по русски.';
    var msg = 'I\'m help to Valentin manage EY infra and simplify daily routine.';
    if (msg.substring(0, msg.length - 1) == scanText.value) {
      console.log(form);
    }
    // console.log('keypress event' + 'key: ' + keyName + ' v: ' + scanText.value);
  });
}

function pushKey(key) {
  msgInput.focus();
  if ('Backspace' == key) {
    msgInput.value = msgInput.value.substring(0, msgInput.value.length - 1);
  } else {
    msgInput.value += key;
  }
}

function keyChain(form, i, resolve) {
  var delay = 0;
  if (i == form.length) {
    resolve();
    return;
  }
  if (i > 0) {
    delay = form[i].time - form[i - 1].time;
  }
  pushKey(form[i].key);
  setTimeout(() => {
    keyChain(form, i + 1, resolve);
  }, delay);
}

function typeMsg(form) {
  return new Promise(function(resolve, reject) {
    keyChain(form, 0, resolve);
  });
}

function pushMsg() {
  var newEl = document.createElement('p');
  newEl.innerHTML = msgInput.value;
  msgInput.value = '';
  content.appendChild(newEl);
}

function perform() {
  httpGetAsync('jarvis-msg.srv', (data) => {
    var msg = JSON.parse(data);
    typeMsg(msg.msg[0])
      .then(() => {
        pushMsg();
        return typeMsg(msg.msg[1]);
      })
      .then(() => {
        pushMsg();
        return typeMsg(msg.msg[2]);
      })
      .then(() => {
        pushMsg();
      });
  });
}

window.addEventListener('load', function(event) {
  content = document.getElementById('content');
  msgInput = document.getElementById('msg');
  perform();
  // scanText = document.getElementById('scanText');
  // scan();
});

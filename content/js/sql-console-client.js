function report() {
  this.reportTag  = document.getElementById('report');
  this.statusTag  = document.getElementById('status');
  this.qTag       = document.getElementById('q');
  this.qNameTag   = document.getElementById('qName');
  this.qSourceTag = document.getElementById('qSource');
  var rect1 = this.qSourceTag.getBoundingClientRect();
  var rect2 = this.qTag.getBoundingClientRect();
  this.qTag.style.width = (rect1.right - rect2.left) + 'px';

  this.render = function (data) {
    if ("error" == data.status) {
      this.statusTag.innerHTML = data.msg;
      this.reportTag.innerHTML = '';
      return;
    }
    var reportData = data;
    var innerHTML = '';

    innerHTML += wrap('tr', reportData.header.map((el) => {
      return wrap('td', el);
    }).join(''));

    innerHTML += reportData.result.map((row) => {
      return wrap('tr', row.map((el) => wrap('td', el)).join(''));
    }).join('');
    this.statusTag.innerHTML = 'Ok';
    this.reportTag.innerHTML = wrap('table', innerHTML);
  };

  this.update = function () {
    if (this.qTag.value.length > 3) {
      httpPostAsync('sql-console.srv', this.qTag.value)
        .then((data) => {
          this.render(JSON.parse(data));
        });
    }
  };

  this.add = function () {

    httpPostAsync('sql-console.srv', JSON.stringify({name: this.qNameTag, q: this.qTag.value}))
      .then((data) => {
        this.render(JSON.parse(data));
      });
  }
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});


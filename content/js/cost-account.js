function report() {
  this.reportTag = document.getElementById('report');
  this.statusTag = document.getElementById('status');
  this.qTag = document.getElementById('q');
  this.qTag.onchange = (event) => {
    this.qTag.value = this.qTag.value.replace(/[' \s]/g, '');
    location.hash = 'q=' + this.qTag.value;
  }
  this.qTag.addEventListener("keyup", (event) => {
    event.preventDefault();
    if (event.keyCode === 13) {
      this.update();
    }
  });

  if ('' != location.hash) {
    this.qTag.value = location.hash.substring(3);
  }

  this.render = function (data) {
    var reportData = data.data;
    var innerHTML = '';

    innerHTML += wrap('tr', reportData.header.map((el) => {
      return wrap('td', el);
    }).join(''));

    innerHTML += reportData.result.map((row) => {
      return wrap('tr', row.map((el) => wrap('td', el)).join(''));
    }).join('');

    this.reportTag.innerHTML = wrap('table', innerHTML);
    this.statusTag.innerHTML = data.status;
  };

  this.update = function () {
    if ('' != location.hash) {
      httpGetAsync('cost-data-account.srv?' + location.hash.substring(1), (data) => {
        this.render(JSON.parse(data));
      });
    }
  };
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});


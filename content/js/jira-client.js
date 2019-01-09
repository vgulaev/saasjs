function report() {
  this.reportTag = document.getElementById('report');
  this.statusTag = document.getElementById('status');
  this.qTag = document.getElementById('q');

  this.qTag.addEventListener('keyup', (e) => {
    if (event.keyCode === 13) {
      this.update();
    }
    console.log('keyup: %s', event.keyCode);
  });

  this.checkRow = function () {
    return true;
  }

  this.render = function () {
    let data = this.data;
    var innerHTML = '';
    // var cond = document.getElementById('q').value;
    // console.log(cond);
    innerHTML += data.data.issues.filter((row) => this.checkRow(row)).map((row, index) => {
      let td = '';
      td += wrap('td', index + 1);
      td += wrap('td', wrap('a', row.key, {href: `https://jira.devfactory.com/browse/${row.key}`}));
      let assignee = (null == row.fields.assignee) ? 'null' : row.fields.assignee.name;
      td += wrap('td', assignee);
      td += wrap('td', row.fields.summary);
      return wrap('tr', td);
    }).join('');
    // innerHTML += reportData.result.map((row) => {
    //   return wrap('tr', row.map((el) => wrap('td', el)).join(''));
    // }).join('');

    this.reportTag.innerHTML = wrap('table', innerHTML);
    // this.statusTag.innerHTML = 'Data updated at: ' + reportData.generatedAt;
  };

  this.update = function () {
    httpGetAsync('jira.srv?cr', (data) => {
      this.data = JSON.parse(data);
      this.render();
    });
  };
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});

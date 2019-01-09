function report() {
  this.reportTag = document.getElementById('report');
  this.statusTag = document.getElementById('status');
  this.qTag = document.getElementById('q');

  this.qTag.addEventListener('keyup', (event) => {
    this.update();
  });

  this.checkRow = function (row) {
    if (undefined == this.q) {
      return true;
    }
    let s = JSON.stringify(row);
    console.log(this.q);
    // console.log(s);
    return this.q.reduce((acc, el) => acc && (s.indexOf(el) != -1),  true);
  }

  this.render = function () {
    let data = this.data;
    var innerHTML = '';
    if (0 < this.qTag.value.length) {
      this.q = this.qTag.value.split('&&').map(el => el.trim()).filter(el => el.length > 0);
    } else {
      this.q = undefined;
    }

    innerHTML += data.data.issues.filter((row) => this.checkRow(row)).map((row, index) => {
      let td = '';
      td += wrap('td', index + 1);
      td += wrap('td', wrap('a', row.key, {href: `https://jira.devfactory.com/browse/${row.key}`}));
      let assignee = (null == row.fields.assignee) ? 'null' : row.fields.assignee.name;
      td += wrap('td', assignee);
      td += wrap('td', row.fields.summary);
      return wrap('tr', td);
    }).join('');

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

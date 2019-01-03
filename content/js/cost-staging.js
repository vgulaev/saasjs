function report() {
  this.reportTag = document.getElementById('report');
  this.statusTag = document.getElementById('status');

  this.render = function (data) {
    var reportData = JSON.parse(data.data);
    var innerHTML = '';

    innerHTML += wrap('tr', reportData.header.map((el) => {
      return wrap('td', el);
    }).join(''));

    innerHTML += reportData.result.map((row) => {
      return wrap('tr', row.map((el) => wrap('td', el)).join(''));
    }).join('');

    this.reportTag.innerHTML = wrap('table', innerHTML);
    this.statusTag.innerHTML = 'Data updated at: ' + reportData.generatedAt;
  };

  this.update = function () {
    httpGetAsync('cost-data-staging.srv', (data) => {
      this.render(JSON.parse(data));
    });
  };

  this.requestDataFromAWS = function() {
    this.statusTag.innerHTML = 'Data requested';
    httpGetAsync('cost-data-staging.srv?o=requestDataFromAWS', (data) => {
      var reportData = JSON.parse(data);
      this.statusTag.innerHTML = reportData['status'];
    });
  };
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});

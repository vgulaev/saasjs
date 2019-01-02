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
    // innerHTML += _array.reduce((acc, value, index) => {
    //   let td = '';
    //   // var td = reportData.result.map((el, inx) => wrap('td', (() => {
    //   //   var _text = el[index];
    //   //   if (index != 0) {
    //   //     _text = formatCurrency(el[index]);
    //   //   }
    //   //   return _text}).call(), {style: 'text-align: right;'})).join('');
    //   td = wrap('td', reportData.header[index]) + td;
    //   return acc + wrap('tr', td);
    // },"");

    this.reportTag.innerHTML = wrap('table', innerHTML);
    this.statusTag.innerHTML = 'Data updated at: ' + reportData.generatedAt;
  };

  this.update = function () {
    httpGetAsync('cost-data-staging.srv', (data) => {
      this.render(JSON.parse(data));
    });
  };
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});

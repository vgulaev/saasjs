function formatCurrency(number) {
  return '$' + number.toFixed(1) + 'k';
}

function report() {
  this.timer = {
    stop: function () {
      this.startedAt = undefined;
    },
    tick: function () {
      if (undefined == this.startedAt) {
        return;
      }
      this.el.innerHTML = ' ' + ((performance.now() - this.startedAt)/1000).toFixed(2) + 's';
      setTimeout(() => {this.tick()}, 200);
    },
    start: function () {
      this.el = document.getElementById('timer');
      this.startedAt = performance.now();
      this.tick();
    }
  };

  this.status = function (msg) {
    this.reportTag.innerHTML = msg + '<span id="timer"></span>';
    this.timer.start();
    setTimeout(() => {this.timer.stop()}, 4000);
  };

  this.reportTag = document.getElementById('report');
  this.statusTag = document.getElementById('status');
  // this.status('Report started');

  this.render = function (data) {
    var _array = (new Array(11)).fill('');
    var reportData = JSON.parse(data.data);
    var innerHTML = '';

    innerHTML += _array.reduce((acc, value, index) => {
      var td = reportData.result.map((el, inx) => wrap('td', (() => {
        var _text = el[index];
        if (index != 0) {
          _text = formatCurrency(el[index]);
        }
        return _text}).call(), {style: 'text-align: right;'})).join('');
      td = wrap('td', reportData.header[index]) + td;
      return acc + wrap('tr', td);
    },"");

    this.reportTag.innerHTML = wrap('table', innerHTML, {style: `width: ${110 * (reportData.result.length + 1)}px`});
    this.statusTag.innerHTML = 'Data updated at: ' + reportData.generatedAt;
  };

  this.update = function () {
    httpGetAsync('cost-data-weekly.srv?' + location.hash.substring(1), (data) => {
      this.render(JSON.parse(data));
    });
  };
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});

// document.addEventListener('copy', function(e) {
//   console.log('copied');
//   e.clipboardData.setData('text/plain', 'Hello World!');
//   e.preventDefault();
// });

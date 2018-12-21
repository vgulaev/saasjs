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
  };

  this.reportTag = document.getElementById('report');
  this.status('Report started');
}

window.addEventListener('load', function(event) {
  app = new report();
});

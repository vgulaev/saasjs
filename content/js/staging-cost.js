function report() {
  this.update = function () {
    console.log('Report');
  }
}

window.addEventListener('load', function(event) {
  app = new report();
  app.update();
});

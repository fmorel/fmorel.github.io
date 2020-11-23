var obj = {};
obj.alpha = alphavantage({ key: 'L7B1PRR8D9I68OSZ' });
obj.alpha.data.daily(`ibm`).then((data) => {
  sonsole.log(data);
  obj.metadata = data["Meta Data"].toString();
});

var app = new Vue({
    el: '#app',
    data: {
        message: obj.metadata
    },
});

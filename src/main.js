var app = new Vue({
    el: '#app',
    data: {
        message: "waiting ...",
        date: ""
    },
    created : function () {
        var fullDate = new Date();
        this.date = fullDate.toDateString();
    },
    mounted : function () {
        var alpha = alphavantage({ key: 'L7B1PRR8D9I68OSZ' });
        alpha.data.daily('SQNS').then((data) => {
            var daily = data["Time Series (Daily)"];
            this.date = Object.keys(daily)[0];
            var firstDay = daily[this.date];
            this.message = "Open @" + firstDay["1. open"] + ". Close @" + firstDay["4. close"];
        });
    }
});


Vue.component('portfolio-element', {
    props: {
        stock: Object
    },
    template: `
        <tr>
        <td> {{stock.symbol}} </td>
        <td> {{stock.buying_price}} </td>
        <td style="color:green"> {{stock.price}} </td>
        <td> <button v-on:click="$emit('sell-stock')"> Sell </button> </td>
        </tr>
    `
});


var alpha_wrapper = {
    alpha : alphavantage({ key: 'L7B1PRR8D9I68OSZ' }),

    fetch_price : function (stock) {
        this.alpha.data.daily(stock.symbol).then((data) => {
            const daily = data["Time Series (Daily)"];
            const date = Object.keys(daily)[0];
            const firstDay = daily[date];
            stock.price = firstDay["1. open"];
        });
    }
};

function AlphaWrapper2() {
    this.options = {
        interval: 'daily',
        amount: '1'
    };
    this.handle = new Stocks('L7B1PRR8D9I68OSZ');
    this.fetch_price = function (stock) {
        this.options.symbol = stock.symbol;
        this.handle.timeSeries(this.options).then(
            (result) => {
                stock.price = result[0].high;
            });
    };
};

var alpha_wrapper2 = new AlphaWrapper2();

var app = new Vue({
    el: '#app',
    data: {
        message: "waiting ...",
        stocks: [
          {
            id: 0,
            symbol: 'SQNS',
            buying_price: 2.00,
            price: '...'
          },
          {
            id: 1,
            symbol: 'IBM',
            buying_price: 80.0,
            price: '...'
          }
        ],
    },
    mounted: function () {
        for (let stock of this.stocks) {
            alpha_wrapper2.fetch_price(stock);
        }
    },
    methods: {
        sell_stock : function (stock) {
            alert("Stock " + stock.symbol + " sold !");
        }
    }
});

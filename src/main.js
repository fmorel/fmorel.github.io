Vue.config.productionTip = false;
const price_wait = '...';

Vue.component('portfolio-element', {
    props: {
        stock: Object
    },
    computed: {
        get_price_style: function() {
            ret = {};
            if (this.stock.price === price_wait) {
                ret.color = 'blue';
            } else if (this.stock.error) {
                ret.backgroundColor = 'black';
                ret.color = 'red';
            } else if (this.stock.price > this.stock.buying_price) {
                ret.color = 'green';
            } else {
                ret.color = "red";
            }
            return ret;
        },
        get_price: function() {
            if (this.stock.price === price_wait) {
                return price_wait;
            } else if (this.stock.error) {
                return 'N/A';
            }
            return this.stock.sold_price().toFixed(2);
        },
        get_percent: function() {
             if (this.stock.price === price_wait) {
                return price_wait;
            } else if (this.stock.error) {
                return 'N/A';
            }
            let p = 100 * (this.stock.price - this.stock.buying_price)/this.stock.buying_price;
            return p.toFixed(2);
        }
    },      
    template: `
        <tr>
        <td> {{stock.symbol}} </td>
        <td> {{stock.buying_price}} </td>
        <td> {{stock.amount}} </td>
        <td v-bind:style="get_price_style"> {{stock.price}} ({{get_percent}}%) </td>
        <td v-bind:style="get_price_style"> {{get_price}} </td>
        <td class="centered"> <button v-on:click="$emit('sell-stock')"> Sell </button> </td>
        </tr>
    `
});

function AlphaWrapper2() {
    this.options = {
        interval: 'daily',
        amount: '1'
    };
    this.handle = new Stocks('L7B1PRR8D9I68OSZ');
    this.fetch_price = function (stock) {
        tthis = this;
        this.options.symbol = stock.symbol;
        this.handle.timeSeries(this.options)
            .then(
                (result) => {
                    stock.price = result[0].high;
                })
            .catch(
                (error) => {
                    if (error.timeout) {
                        stock.price = price_wait;
                        setTimeout(function() {g_fetch_price(stock);}, 30000);
                    } else if (error.error) {
                        stock.error = true;
                        stock.price = 'Symbol unknown';
                    }
                });
    };
};

var alpha_wrapper2 = new AlphaWrapper2();

function g_fetch_price(stock)
{
    alpha_wrapper2.fetch_price(stock);
}

function Stock(id, symbol, buying_price, amount) {
    this.id = id;
    this.symbol = symbol;
    this.buying_price = buying_price;
    this.amount = amount;
    this.price = price_wait;
    this.error = false;
}

Stock.prototype.sold_price = function()
{
    if (this.error || this.price === price_wait)
        return 0;
    return (this.price - this.buying_price) * this.amount;
}

var app = new Vue({
    el: '#app',
    data: {
        addsymbol: "",
        addamount: 1,
        addprice: 10,
        currentId: 0,
        stocks: [],
        cash: 0,
    },
    mounted: function () {
        my_object = localStorage.getItem("stocks");
        if (my_object !== null)
            this.stocks = JSON.parse(my_object).map(x => Object.setPrototypeOf(x, Stock.prototype));
        this.currentId = localStorage.getItem("currentId");
        for (let stock of this.stocks) {
            g_fetch_price(stock);
        }
    },
    computed : {
        potential_gains: function() {
            let sum = 0;
            for (let stock of this.stocks) {
                sum += stock.sold_price();
            }
            return sum.toFixed(2);
        }
    },
    methods: {
        sell_stock : function (stock) {
            this.stocks.splice(this.stocks.indexOf(stock), 1);
            cash += stock.sold_price();
            localStorage.setItem("stocks", JSON.stringify(this.stocks));
        },
        add_stock : function() {
            stock = new Stock(this.currentId,
                              this.addsymbol, 
                              this.addprice,
                              this.addamount);
            g_fetch_price(stock);
            this.stocks.push(stock);
            this.currentId++;
            localStorage.setItem("stocks", JSON.stringify(this.stocks));
            localStorage.setItem("currentId", this.currentId);
        },
        clear_all: function() {
            this.stocks =  [];
            this.currentId = 0;
            localStorage.setItem("stocks", JSON.stringify(this.stocks));
            localStorage.setItem("currentId", this.currentId);
        }
    }
});

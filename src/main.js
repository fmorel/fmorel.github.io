Vue.config.productionTip = false;
const price_wait = '...';
const chart_size = 90;

Vue.component('portfolio-element', {
    props: {
        stock: Object,
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
        <td class="centered"> 
            <button class="pure-button button-danger button-inline" v-on:click="$emit('sell-stock')"> Sell </button>
            <button class="pure-button button-inline" v-on:click="$emit('toggle-chart')"> Chart </button>
        </td>
        </tr>
    `
});

Vue.component('portfolio-chart', {
    props: {
        stock: Object,
    },
    mounted: function () {
        var ctx = document.getElementById('chart_' + this.stock.id);
        var chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels : this.stock.chart_label,
                datasets : [{
                    label: this.stock.symbol,
                    data: this.stock.chart_data,
                    borderColor : 'rgba(128, 128, 255, 0.8)',
                    backgroundColor: 'rgba(64, 64, 192, 0.5)'
                }]
            },
            options : {
                scales : {
                    xAxes : [{
                        type: "time",
                    }]
                },
                annotation: {
                    annotations: [{
                        type: 'line',
                        mode: 'horizontal',
                        display: true,
                        scaleID: 'y-axis-0',
                        value: this.stock.buying_price,
                        borderColor: 'rgba(255, 128, 128, 0.8)',
                        label: {
                            enabled: true,
                            content: 'Buying price'
                        }
                    }]
                }
            }
        });
    },
    template : `
        <tr>
        <td colspan="6">
        <canvas v-bind:id="'chart_' + stock.id"></canvas>
        </td>
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
                    var r = result.splice(0, chart_size);
                    stock.price = r[0].high;
                    stock.chart_data = r.map(x => x.high);
                    stock.chart_label = r.map(x => x.date);
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
    this.chart_data = [];
    this.chart_label = [];
    this.show_chart = false;
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
        storage_string: "",
    },
    mounted: function () {
        my_object = localStorage.getItem("stocks");
        if (my_object !== null)
            this.stocks = JSON.parse(my_object).map(x => new Stock(x.id, x.symbol, x.buying_price, x.amount));
        this.currentId = this.stocks.reduce(
                            function(max, s) {
                                if (s.id > max)
                                    return s.id;
                                return max;
                            }, 0);
        for (let stock of this.stocks) {
            g_fetch_price(stock);
        }
    },
    computed : {
        potential_gains: function() {
            let sum = this.stocks.reduce(
                        function(sum, s) {
                            return sum + s.sold_price();
                        }, 0);
            return sum.toFixed(2);
        }
    },
    methods: {
        sell_stock : function (stock) {
            this.stocks.splice(this.stocks.indexOf(stock), 1);
            cash += stock.sold_price();
            this.refresh();
        },
        toggle_chart : function (stock) {
            stock.show_chart = !stock.show_chart;
        },
        add_stock : function() {
            stock = new Stock(this.currentId,
                              this.addsymbol, 
                              this.addprice,
                              this.addamount);
            g_fetch_price(stock);
            this.stocks.push(stock);
            this.currentId++;
            this.refresh();
        },
        clear_all: function() {
            this.stocks =  [];
            this.currentId = 0;
            this.refresh();
        },
        refresh: function() {
            localStorage.setItem("stocks", JSON.stringify(this.stocks));
        },
        export_storage: function() {
            this.storage_string = btoa(localStorage.getItem("stocks"));
            navigator.clipboard.write(this.storage_string).then(
                function () {
                    alert("Storage string copied to clipboard");
                });
        },
        import_storage: function() {
            /* Only change localstorage and reload the page.
             * Let the mounted function handle everything */
            localStorage.setItem("stocks", atob(this.storage_string));
            location.reload();
            return false;
        }

    }
});

Vue.config.productionTip = false;

Vue.component('portfolio-element', {
    props: {
        stock: Object
    },
    computed: {
        get_price_style: function() {
            ret = {};
            if (this.stock.error) {
                ret.backgroundColor = "black";
                ret.color = "red";
            } else if (this.stock.price > this.stock.buying_price) {
                ret.color = "green";
            } else {
                ret.color = "red";
            }
            return ret;
        },
        get_price: function() {
            price = (this.stock.price - this.stock.buying_price) * this.stock.amount;
            return price.toFixed(2);
        }
    },      
    template: `
        <tr>
        <td> {{stock.symbol}} </td>
        <td> {{stock.buying_price}} </td>
        <td> {{stock.amount}} </td>
        <td v-bind:style="get_price_style"> {{stock.price}} </td>
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
        this.options.symbol = stock.symbol;
        this.handle.timeSeries(this.options)
            .then(
                (result) => {
                    stock.price = result[0].high;
                })
            .catch(
                (error) => {
                    stock.error = true;
                    if (error.timeout)
                        stock.price = '...';
                    else if (error.error)
                        stock.price = 'Symbol unknown';
                });
    };
};

var alpha_wrapper2 = new AlphaWrapper2();

var app = new Vue({
    el: '#app',
    data: {
        addsymbol: "",
        addamount: 1,
        addprice: 0,
        currentId: 2,
        stocks: [
          {
            id: 0,
            symbol: 'SQNS',
            buying_price: 2.00,
            price: '...',
            amount: 10
          },
          {
            id: 1,
            symbol: 'IBM',
            buying_price: 80.0,
            price: '...',
            amount: 5,
          }
        ],
    },
    mounted: function () {
        console.log('Coucou');
        for (let stock of this.stocks) {
            alpha_wrapper2.fetch_price(stock);
        }
    },
    methods: {
        sell_stock : function (stock) {
            alert("Stock " + stock.symbol + " sold !");
        },
        add_stock : function() {
            stock = 
              {
                id: this.currentId,
                symbol: this.addsymbol, 
                buying_price: this.addprice,
                amount: this.addamount,
                price: '...'
              };
            alpha_wrapper2.fetch_price(stock);
            this.stocks.push(stock);
            this.currentId++;
            alert("Stock "+ this.addsymbol + " added");
        }
    }
});

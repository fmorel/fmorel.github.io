  var client_loaded = false;
  var n_choices = 2;
  var restrict_area= "WORLD";
  var reactor_list = [];
  var n_reactors = 0;

  gapi.load("client");
  
  function start() {
    if (!client_loaded) {
        gapi.client.setApiKey("AIzaSyAvNThm8-PrQ4bsjAToydyYqLfFLE9rOA4");
        gapi.client.load("https://content.googleapis.com/discovery/v1/apis/customsearch/v1/rest")
        .then(start_game,
            function(err) { console.error("Error loading GAPI client for API", err); });
    } else {
        start_game();
    }
  }

  function start_game() {
    client_loaded = true;
    n_choices = document.getElementById('n_choices').value;
    restrict_area = document.getElementById('restrict_area').value;
    document.getElementById('picture_div').style.display="inherit";
    document.getElementById('picture_in').style.display="inherit";
    fetch('./resources/ReactorList.json')
    .then(function(response) {
           return response.json();
          })
    .then(parse_reactors);
  }
  
  function parse_reactors(json) {
    /* First restrict based on country */
    if (restrict_area != "WORLD") {
        reactor_list = json.filter(function (item) {
                                    return (item.country === restrict_area);
                                  });
    } else {
        reactor_list = json;
    }
    /* Remove identical reactors */
    reactor_list = reactor_list.map(function(item) {
                     item.name = item.name.replace(/-[0-9]*/, '');
                     return item;
                     });
    /* Remove duplicates with set */
    reactor_list = Array.from(new Set(reactor_list));
    n_reactors = reactor_list.length;
    for (let i = 0; i < 1; i++) {
        game_step();
    }
  }

  function rand_int(n) {
    return Math.floor(Math.random()*n);
  }

  function next_step() {
  }

  function game_step() {
    var idx = rand_int(n_reactors);
    var reactor = reactor_list[idx];

    gapi.client.search.cse.list({
     "cx":"d55ce6910417e47c5",
     "q": reactor.country + ' ' + reactor.name + ' ' + "power plant",
     "imgSize": "large",
     "imgType": "photo"
    })
    .then(function(response) {
        var metatag;
        /* Look-up the first 50 results to take the first suitable image */
        for (let i = 0; i < 50; i++) {
            metatag = response.result.items[i].pagemap.metatags[0];
            if ("og:image" in metatag && "og:image:width" in metatag && metatag["og:image:width"] >= 600)
                break;
        }
        /* Could not find a suitable image ... go to next step */
        if (!("og:image" in metatag)) {
            console.log("Could not find a suitable image for " + reactor.name + " in " + reactor.country);
            next_step();
        } else {
            var ratio = metatag["og:image:height"] / metatag["og:image:width"];
            var img_url = metatag["og:image"];
            /* Set image  and force it to 600px wide*/
            var dom_img = document.getElementById('picture_content');
            dom_img.src = img_url;
            dom_img.width = 700;
            dom_img.height = 700 * ratio;
            next_step();
        }
    },
        function(err) { 
        console.error("Execute error", err);
    });
  }

  function choices_update(val) {
    document.getElementById('n_choices_label').innerHTML = "Choices: " + val + " ";
  }

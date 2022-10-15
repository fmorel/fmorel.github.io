  var client_loaded = false;
  var n_choices = 2;
  var restrict_area= "WORLD";
  var reactor_list = [];
  var n_reactors = 0;
  var answer;

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

    document.getElementById('settings_div').style.display="none";
    document.getElementById('settings_in').style.display="none";

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
    game_step();
  }

  function rand_int(n) {
    return Math.floor(Math.random()*n);
  }

  function m_distinct_rand(m, n) {
    var ret = [];
    var i = 0;
    if (m > n)
        return [0];
    while (i < m) {
        p = rand_int(n);
        if (!(ret.includes(p))) {
            ret[i] = p;
            i++;
        }
    }
    return ret;
  }

  function next_step() {
    document.getElementById('result_div').style.display = 'none';
    document.getElementById('result_in').style.display = 'none';
    document.getElementById('result_next').style.display = 'none';

    game_step();
  }

  function game_step() {
    var clues = m_distinct_rand(n_choices, n_reactors);
    var reactor = reactor_list[clues[0]];

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
            dom_img.height = 700*ratio;
            display_clues(clues);
        }
    },
        function(err) { 
        console.error("Execute error", err);
    });
  }

  function display_clues(clues) {
    document.getElementById('guess').style.display = 'inherit';
    document.getElementById('guess_in').style.display = 'inherit';
    radio_content = '';
    const numbers = ['one', 'two', 'three', 'four', 'five'];
    answer = clues[0];
    clues = clues.sort(function(a, b) {
                        return reactor_list[a].name < reactor_list[b].name;
                       });
    for (i = 0; i < clues.length; i++) {
        reactor = reactor_list[clues[i]];
        radio_content += '<label for="checkbox-radio-option" class="pure-radio">\n';
        radio_content += '<input type="radio" id="checkbox-radio-option-' + numbers[i] + '" name="guess_choice" value="' + clues[i] +'" checked="' + ((i == 0) ? 'true' : 'false') + '"/> '
        radio_content += reactor.name + ', ' + reactor.country + '\n';
        radio_content += '</label>\n';
    }
    document.getElementById('guess_content').innerHTML = radio_content;
  }

  function guess() {
    var select_answer = document.querySelector('input[name="guess_choice"]:checked').value;
    
    document.getElementById('guess').style.display = 'none';
    document.getElementById('guess_in').style.display = 'none';

    document.getElementById('result_div').style.display = 'inherit';
    document.getElementById('result_in').style.display = 'inherit';
    document.getElementById('result_next').style.display = 'inherit';

    reactor = reactor_list[answer];
    if (select_answer == answer)
        document.getElementById('result_in').innerHTML = '<h1> Right !</h1><br>';
    else
        document.getElementById('result_in').innerHTML = '<h1> Wrong !</h1><br>';
    document.getElementById('result_in').innerHTML += 'Right answer is: ' + reactor.name + ', ' + reactor.country + '<br>';
  }


  function choices_update(val) {
    document.getElementById('n_choices_label').innerHTML = "Choices: " + val + " ";
  }

  var client_loaded = false;
  var n_choices = 3;
  var restrict_area= "WORLD";
  var reactor_list = [];
  var n_reactors = 0;
  var answer;
  var fuzz;
  var cur_page;
  var clues;
  var n_step;
  var n_success;
  var score;

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

  function update_score() {
    score = n_success * n_choices * n_reactors;
    document.getElementById('score_in').innerHTML =
        'Successful guesses: ' + n_success +' / ' + n_step + '<br>' +
        'Score: ' + score + '<br>';
  }

  function start_game() {
    client_loaded = true;
    n_choices = document.getElementById('n_choices').value;
    restrict_area = document.getElementById('restrict_area').value;

    document.getElementById('settings_div').style.display="none";
    document.getElementById('settings_in').style.display="none";

    document.getElementById('picture_div').style.display="inherit";
    document.getElementById('picture_in').style.display="inherit";

    n_step = 0;
    n_success = 0;
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
    
    update_score();
    document.getElementById('score_div').style.display="inherit";
    document.getElementById('score_in').style.display="inherit";
    
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
    document.getElementById('picture_wait').style.display= 'none';
    document.getElementById('picture_in').style.display= 'inherit';

    game_step();
  }

  function retry_step() {
    document.getElementById('picture_in').style.display= 'none';
    document.getElementById('picture_wait').style.display= 'inherit';
    setTimeout(next_step, 1000);
  }

  function handle_result_page(response) {
      var metatag;
      var found = false;

      if (response.status != 200 ||
          !response.result || !response.result.items) {
          console.log("Bad response, code: " + response.status);
          retry_step();
          return;
      }
      /* Look for suitable images and take the fuzz-th image */
      for (let i = 0; i < response.result.items.length; i++) {
          let item = response.result.items[i];
          if (!item.pagemap || !item.pagemap.metatags || !item.pagemap.metatags.length)
              continue;
          metatag = item.pagemap.metatags[0];
          if (metatag && "og:image" in metatag && "og:image:width" in metatag && metatag["og:image:width"] >= 600) {
              if (fuzz == 0) {
                  found = true;
                  break;
              } else {
                  fuzz--;
              }
          }
      }
      /* Could not find a suitable image */
      if (!found) {
          console.log("Could not find a suitable image");
          cur_page++;
          if (cur_page == 4) {
            /* Next step */
            console.log("Not suitable result after 5 pages, next step");
            retry_step();
          } else {
            let next_page = response.result.queries.nextPage[0];
            /* Next result page */
            perform_query(
            {
              "cx": next_page.cx,
              "q": next_page.searchTerms,
              "imgSize": next_page.imgSize,
              "imgType": next_page.imgType,
              "start": next_page.startIndex
            });
          }
      } else {
          var img_url = metatag["og:image"];
          var dom_img = document.getElementById('picture_content');
          dom_img.src = img_url;
          dom_img.style.width = "100%";
          dom_img.style.height = "auto";
          /* Carry on the quizz */
          display_clues(clues);
      }
  }

  function perform_query(query) {
    gapi.client.search.cse.list(query).then(
        handle_result_page,
        function(err) { 
            console.error("Execute error", err);
            retry_step();
        }
    );
  }

  function game_step() {
    clues = m_distinct_rand(n_choices, n_reactors);
    fuzz = rand_int(2);
    cur_page = 0;
    var reactor = reactor_list[clues[0]];
    
    perform_query(
    {
      "cx":"d55ce6910417e47c5",
      "q": reactor.country + ' ' + reactor.name + ' ' + "power plant",
      "imgSize": "large",
      "imgType": "photo"
    });
  }

  function display_clues() {
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


    reactor = reactor_list[answer];
    n_step++;
    if (select_answer == answer) {
        document.getElementById('result_in').innerHTML = '<h1> Right !</h1><br>';
        n_success++;
    } else {
        document.getElementById('result_in').innerHTML = '<h1> Wrong !</h1><br>';
    }
    document.getElementById('result_in').innerHTML += 'Right answer is: ' + reactor.name + ', ' + reactor.country + ' started in ' + reactor.date + 'with a (thermal) power per reactor of ' + reactor.power + ' MW<br>';
    update_score();

    if (n_step == 10)
        document.getElementById('result_in').innerHTML += 'End of the game, you scored <b>' + score + 'points !</b><br>Please reload the page if you want to play again<br>';

    document.getElementById('result_div').style.display = 'inherit';
    document.getElementById('result_in').style.display = 'inherit';
    
    if (n_step < 10)
        document.getElementById('result_next').style.display = 'inherit';
  }


  function choices_update(val) {
    document.getElementById('n_choices_label').innerHTML = "Choices: " + val + " ";
  }

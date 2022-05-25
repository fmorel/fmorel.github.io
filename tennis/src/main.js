
function Match(p_0, p_1)
{
    this.sets = [];
    this.cur_set = 0;
    this.prob = [p_0, p_1];
    this.winning_sets = 3;
    this.score = [0, 0];
}

function Set(prob, cur_player, last_set)
{
    this.prob = prob;
    this.score = [0, 0];
    this.cur_player = cur_player;
    this.last_set = last_set;
    this.tie_break = false;
    this.tie_score = [0, 0];
}

// Generic victory condition when one of the score is over min_val with a difference of min_diff
function get_winner(score, min_val, min_diff)
{
    if (score[0] >= min_val && (score[0] - score[1]) >= min_diff)
        return 0;
    if (score[1] >= min_val && (score[1] - score[0]) >= min_diff)
        return 1;
    return -1;
}

// Returns player id of game winner, assuming that player 0 is the serving player (and p is the prob to win)
function game(p)
{
    var score = [0, 0];
    var winner;
    while (true) {
        r = Math.random();
        if (r <= p)
            score[0]++;
        else
            score[1]++;
        //Victory condition
        winner = get_winner(score, 4, 2);
        if (winner >= 0)
            break;
    }
    return winner;
}

Set.prototype.play_tie_break = function (min_points)
{
    this.tie_break = true;
    var tie_count = 0;
    var winner;
    while (true) {
        r = Math.random();
        if (r <= this.prob[this.cur_player])
            this.tie_score[this.cur_player]++;
        else
            this.tie_score[this.cur_player ^ 1]++;
        tie_count++;
        //Switch serving player every 2 serves in the 'ABBA' pattern
        if (tie_count % 2 == 1)
            this.cur_player ^= 1;

        winner = get_winner(this.tie_score, min_points, 2);
        if (winner >= 0)
            break;
    }
    this.score[winner]++;
    return winner;
}

Set.prototype.play = function ()
{
    var cur_win;
    var winner;
    while (true) {
        // Play a game and update set score
        cur_win = game(this.prob[this.cur_player]);
        this.score[this.cur_player ^ cur_win]++;
        // Next player to serve
        this.cur_player ^= 1;
        // Victory condition
        if (this.score[0] == 6 && this.score[1] == 6) {
            var min_points = 7;
            if (this.last_set)
                min_points = 10;
            winner = this.play_tie_break(min_points);
            break;
        }
        winner = get_winner(this.score, 6, 2);
        if (winner >= 0)
            break;
    }
    this.winner = winner;
}

Set.prototype.display_score = function (player)
{
    var html = "";
    if (this.winner == player)
        html += "<b>";
    html += this.score[player];
    if (this.tie_break)
        html += "<sup>" + this.tie_score[player] + "</sup>";
    if (this.winner == player)
        html += "</b>";
    return html;
}

Match.prototype.play = function ()
{
    var cur_player = 0;
    while (true) {
        var set = new Set(this.prob, cur_player, (this.cur_set == 2*this.winning_sets - 2));
        set.play();
        this.score[set.winner]++;
        cur_player = set.cur_player;        //Player has already been toggled
        this.sets[this.cur_set++] = set;    // Keep set to display score
        if (this.score[0] >= this.winning_sets) {
            this.winner = 0;
            break;
        }
        if (this.score[1] >= this.winning_sets) {
            this.winner = 1;
            break;
        }
    }
    var results_rows = ["<th>Player A</td>", "<th>Player B</td>"];
    this.sets.forEach(
        function(set) {
            results_rows[0] +="<td>" + set.display_score(0) + "</td>";
            results_rows[1] +="<td>" + set.display_score(1) + "</td>";
        }
    );
    if (this.winner == 0)
        this.results_html = "<table class='pure-table'><tr class='winner-row'>" + results_rows[0] + "</tr><tr>" + results_rows[1] + "</tr></table>";
    else
        this.results_html = "<table class='pure-table'><tr>" + results_rows[0] + "</tr><tr class='winner-row'>" + results_rows[1] + "</tr></table>";
        
}

function validate_params(p0, p1)
{
    if (isNaN(p0) || isNaN(p1) ||
        p0 < 0 || p0 > 1 ||
        p1 < 0 || p1 > 1) {
        alert("Values must be number between 0 and 1");
        return false;
    }
    if ((p0 == 1 && p1 == 1) ||
        (p0 == 0 && p1 == 0)) {
        alert("Values cannot be both equal to 1 or 0");
        return false;
    }
    return true;
}

function match()
{
    p_serve = document.getElementById("serve_win").value;
    p_other = document.getElementById("other_win").value;

    document.getElementById("results").innerHTML = "";
    if (!validate_params(p_serve, p_other))
        return;
    var match = new Match(p_serve, p_other);
    match.play();
    document.getElementById("results").innerHTML = match.results_html;
}

function match_multiple()
{
    p_serve = document.getElementById("serve_win").value;
    p_other = document.getElementById("other_win").value;
    n_matches = document.getElementById("n_matches").value;
    
    document.getElementById("results").innerHTML = "";
    if (!validate_params(p_serve, p_other))
        return;

    var rem_matches = n_matches, int_id;
    var score = [0, 0];
    var chunk = Math.ceil(n_matches / 30);
    // Separate computations in chunk to perform a little animation
    int_id = setInterval(
        function() {
            var j;
            for (j = 0; j < Math.min(chunk, rem_matches); j++) {
                var match = new Match(p_serve, p_other);
                match.play();
                score[match.winner]++;
            }
            document.getElementById("results").innerHTML = match.results_html;
            rem_matches -= j;
            if (rem_matches == 0) {
                clearInterval(int_id);
                document.getElementById("results").innerHTML += "<br> Player A wins : " + score[0] + " - " + 100*(score[0]/n_matches) + "%";
                document.getElementById("results").innerHTML += "<br> Player B wins : " + score[1] + " - " + 100*(score[1]/n_matches) + "%";
            }
        },
        75);
}

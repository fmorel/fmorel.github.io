// Match object
function Match(p_0, p_1)
{
    this.sets = [];
    this.cur_set = 0;
    this.prob = [p_0, p_1];
    this.winning_sets = 3;
    this.score = [0, 0];
    this.stats = new Stats();
}

// Set object
function Set(match, cur_player, last_set)
{
    this.prob = match.prob;
    this.score = [0, 0];
    this.cur_player = cur_player;
    this.last_set = last_set;
    this.tie_break = false;
    this.tie_score = [0, 0];
    this.stats = match.stats;
}

// Stat
function Stats()
{
    this.n_points_tot = 0;
    this.n_points = [0, 0];
}

function MultipleStats()
{
    this.n_sets_sum = 0;
    this.n_matches = 0;
    this.min_n_points = 10000;
    this.max_n_points = 0;
    this.min_ratio_points_won_victory = [200, 200];   // Minimum pointw won ratio but match was won
    this.min_ratio_points_won_victory_match = [];
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

Set.prototype.play_game = function()
{
    var score = [0, 0];
    var p = this.prob[this.cur_player];
    var winner;
    while (true) {
        r = Math.random();
        //Winner of the point
        if (r <= p)
            winner = this.cur_player;
        else
            winner = this.cur_player ^ 1;
        score[winner]++;
        this.stats.n_points_tot++;
        this.stats.n_points[winner]++;
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
            winner = this.cur_player;
        else
            winner = this.cur_player ^ 1;
        this.tie_score[winner]++;
        tie_count++;
        this.stats.n_points_tot++;
        this.stats.n_points[winner]++;
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
        cur_win = this.play_game();
        this.score[cur_win]++;
        // Next player to serve
        this.cur_player ^= 1;
        // Victory condition
        if (this.score[0] == 6 && this.score[1] == 6) {
            var min_points = 7;
            // Super tie-break for last set
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
        var set = new Set(this, cur_player, (this.cur_set == 2*this.winning_sets - 2));
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
    // Match sheet
    if (this.winner == 0)
        this.results_html = "<table class='pure-table'><tr class='winner-row'>" + results_rows[0] + "</tr><tr>" + results_rows[1] + "</tr></table>";
    else
        this.results_html = "<table class='pure-table'><tr>" + results_rows[0] + "</tr><tr class='winner-row'>" + results_rows[1] + "</tr></table>";
    
    //Statistics
    var ratio = 100 * (this.stats.n_points[this.winner] / this.stats.n_points_tot);
    this.stats_html = "Total points: " + this.stats.n_points_tot + "<br> Ratio of points won by match winner: " + ratio.toPrecision(4) + "%";
}

MultipleStats.prototype.update = function(match)
{
    this.n_sets_sum += match.cur_set;
    this.n_matches++;
    if (match.stats.n_points_tot < this.min_n_points) {
        this.min_n_points = match.stats.n_points_tot;
        this.min_n_points_match = match;
    }

    if (match.stats.n_points_tot > this.max_n_points) {
        this.max_n_points = match.stats.n_points_tot;
        this.max_n_points_match = match;
    }

    var ratio = 100 * (match.stats.n_points[match.winner] / match.stats.n_points_tot);
    if (ratio < this.min_ratio_points_won_victory[match.winner]) {
        this.min_ratio_points_won_victory[match.winner] = ratio;
        this.min_ratio_points_won_victory_match[match.winner] = match;
    }
}

MultipleStats.prototype.display = function()
{
    var mean_sets = this.n_sets_sum / this.n_matches;
    var html = "Average number of sets: <b>" + mean_sets.toPrecision(3) + "</b>";

    html += "<br><br>Shortest match: <b>" + this.min_n_points + "</b> points:<br>";
    html += this.min_n_points_match.results_html;

    html += "<br><br>Longest match: <b>" + this.max_n_points + "</b> points:<br>";
    html += this.max_n_points_match.results_html;

    if (this.min_ratio_points_won_victory[0] <= 100) {
        html += "<br><br>Match won by Player A with least points scored: <b>" + this.min_ratio_points_won_victory[0].toPrecision(4) + "%</b>:<br>";
        html += this.min_ratio_points_won_victory_match[0].results_html;
    }
    if (this.min_ratio_points_won_victory[1] <= 100) {
        html += "<br><br>Match won by Player B with least points scored: <b>" + this.min_ratio_points_won_victory[1].toPrecision(4) + "%</b>:<br>";
        html += this.min_ratio_points_won_victory_match[1].results_html;
    }
    return html;
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
    document.getElementById("stats").innerHTML = match.stats_html;
}

function match_multiple()
{
    p_serve = document.getElementById("serve_win").value;
    p_other = document.getElementById("other_win").value;
    n_matches = document.getElementById("n_matches").value;
    
    document.getElementById("results").innerHTML = "";
    if (!validate_params(p_serve, p_other))
        return;
    if (isNaN(n_matches) || n_matches < 1) {
        alert("Number of matches must be a positive integer");
        return;
    }
    var rem_matches = n_matches, int_id;
    var score = [0, 0];
    var chunk = Math.ceil(n_matches / 30);
    var mstats = new MultipleStats;
    // Separate computations in chunk to perform a little animation
    int_id = setInterval(
        function() {
            var j;
            var match;
            for (j = 0; j < Math.min(chunk, rem_matches); j++) {
                match = new Match(p_serve, p_other);
                match.play();
                score[match.winner]++;
                mstats.update(match);
            }
            document.getElementById("results").innerHTML = match.results_html;
            rem_matches -= j;
            if (rem_matches == 0) {
                clearInterval(int_id);
                document.getElementById("results").innerHTML += "<br> Player A wins : " + score[0] + " - " + 100*(score[0]/n_matches) + "%";
                document.getElementById("results").innerHTML += "<br> Player B wins : " + score[1] + " - " + 100*(score[1]/n_matches) + "%";
                document.getElementById("stats").innerHTML = mstats.display();
            }
        },
        60);
}

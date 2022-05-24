
function Match(p_0, p_1)
{
    this.sets = [];
    this.cur_set = 0;
    this.prob = [p_0, p_1];
    this.winning_sets = 3;
    this.score = [0, 0];
}

function Set(prob, cur_player)
{
    this.prob = prob;
    this.score = [0, 0];
    this.cur_player = cur_player;
}

// Returns player id of game winer, assuming that player 0 is the serving player (and p is the prob to win)
function game(p)
{
    var score = [0, 0];
    while (true) {
        r = Math.random()
        if (r <= p)
            score[0]++;
        else
            score[1]++;
        //Victory condition
        if (score[0] >= 4 && (score[0] - score[1]) >= 2)
            return 0;
        if (score[1] >= 4 && (score[1] - score[0]) >= 2)
            return 1;
    }
}

Set.prototype.play = function ()
{
    var cur_win;
    while (true) {
        // Play a game and update set score
        cur_win = game(this.prob[this.cur_player]);
        this.score[cur_player ^ cur_win]++;
        // Next player to serve
        this.cur_player ^= 1;
        // Victory condition
        // TODO : Tie break
        if (this.score[0] >= 6 && (this.score[0] - this.score[1]) >= 2) {
            this.winner = 0;
            break;
        }
        if (this.score[1] >= 6 && (this.score[1] - this.score[0]) >= 2) {
            this.winner = 1;
            break;
        }
    }
}

Match.prototype.play = function ()
{
    var cur_player = 0;
    while (true) {
        var set = new Set(this.prob, cur_player);
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
    alert("Player " + this.winner + "wins the match in " + (this.cur_set-1) + "sets");
}


function match()
{
    p_serve = document.getElementById("serve_win").value;
    p_other = document.getElementById("other_win").value;
    var match = new Match(p_serve, p_other);
    match.play();
}
    



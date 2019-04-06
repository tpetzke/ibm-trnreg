const internal = {};

module.exports = internal.TrnInfo = class {

    constructor(tournament, players) {
        console.log("Initialize TrnInfo object");
        this.tournament = tournament;
        this.players = players;

        this.players.sort((a, b) => { 
            var twz_a = 0, twz_b = 0; 
            if (a.hasOwnProperty("DWZ")) twz_a = a.DWZ; 
            if (b.hasOwnProperty("DWZ")) twz_b = b.DWZ; 
            if (a.hasOwnProperty("ELO") && a.ELO>twz_a) twz_a = a.ELO; 
            if (b.hasOwnProperty("ELO") && b.ELO>twz_b) twz_b = b.ELO; 
            return twz_b - twz_a; 
          });

        this._playersPerGroup = this.collectPlayersPerGroup();
        this._clubs = this.collectClubCounts(); 
    }

    getTournamentName() {
        return this.tournament.name;
    }

    getSex(sex) {
        var cnt = 0, i;
        for (i=0; i<this.players.length; i++) if (this.players[i].Sex==sex) cnt++;
        return cnt;
    }

    getPlayerCnt() {
        return this.players.length;
    }

    getGroupCnt() {
        return this.tournament.groups.length;
    }

    getStatusCnt(status) {
        var cnt = 0, i;
        for (i=0; i<this.players.length; i++) if (this.players[i].status==status) cnt++;
        return cnt;
    }

    getPlayerPerGroup() {
        return this._playersPerGroup;
    }

    getGroupNames() {
        return this.tournament.groups;
    }

    getClubCnt() {
        return this._clubs.length;
    }

    getTop5ClubNames() {
        var names = [], i = 0;
        for (i = 0; i < 5 && i < this._clubs.length; i++) names.push(this._clubs[i].club);
        return names;
    }

    getTop5ClubCounts() {
        var counts = [], i = 0;
        for (i = 0; i < 5 && i < this._clubs.length; i++) counts.push(this._clubs[i].count);
        return counts;
    }

    getTopClubNameByIdx(idx) {
        if (idx < this._clubs.length) return this._clubs[idx].club;
        return ""; 
    }

    getTopClubCountByIdx(idx) {
        if (idx < this._clubs.length) return this._clubs[idx].count;
        return ""; 
    }

    getPlayerNameByIdx(idx)
    {
        if (idx < this.players.length) return (this.players[i].Title != "" ? this.players[i].Title + " " : "") + this.players[i].Firstname + " " + this.players[i].Lastname;
        return "";
    }

    getPlayerDWZByIdx(idx)
    {
        if (idx < this.players.length) return this.players[i].DWZ;
        return "";
    }

    getPlayerELOByIdx(idx)
    {
        if (idx < this.players.length) return this.players[i].ELO;
        return "";
    }

    getPlayerAttrByIdx(idx)
    {
        if (idx < this.players.length && this.players[i].Sex=="female") return "w";
        return "";
    }

    collectPlayersPerGroup() {
        var i = 0, j = 0, pPG = [];
        for (i = 0; i < this.tournament.groups.length; i++) pPG.push(0);
        for (i = 0; i < this.players.length; i++) {
            for (j=0; j < this.tournament.groups.length; j++) if (this.tournament.groups[j] == this.players[i].Group) pPG[j]++;
        }
        return pPG;
    }

    collectClubCounts() {
        var names = [], clubs = [], i = 0, cnt = 0;
        for (i = 0; i < this.players.length; i++) if (typeof this.players[i].Club !== "undefined") names.push(this.players[i].Club);
        names.sort();

        var currentClub = "";
        for (i = 0; i < names.length; i++) {
            if (names[i] !== currentClub) {
                 if (cnt) clubs.push({"club":currentClub,"count":cnt});
                currentClub = names[i];
                cnt = 1;
            } else cnt++;       
        }
        if (cnt) clubs.push({"club":currentClub,"count":cnt});  // push also the last club to the list
        clubs.sort((a, b) => (a.count < b.count) ? 1 : -1);
    
        return clubs;
    }


}


const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

// Convert player table into object
const convertPlayerObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

// Convert Match table into object
const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// Convert Score table into object
const convertScoreObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    totalScore: dbObject.score,
    totalFours: dbObject.fours,
    totalSixes: dbObject.sixes,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT *
    FROM player_details`;

  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerObjectToResponseObject(eachPlayer)
    )
  );
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT *
    FROM player_details
    WHERE player_id = ${playerId}`;

  const playerResponse = await db.get(getPlayerQuery);
  response.send(convertPlayerObjectToResponseObject(playerResponse));
});

// API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playersId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerQuery = `
  UPDATE
    player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = ${playersId}`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchesId } = request.params;

  const getMatchQuery = `
  SELECT *
  FROM match_details
  WHERE match_id = ${matchesId}`;

  const matchResponse = await db.get(getMatchQuery);
  response.send(matchResponse);
});

// API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playersId } = request.params;

  const getPlayerMatchesQuery = `
    SELECT * 
    FROM player_match_score 
        NATURAL JOIN match_details 
       
    WHERE
        player_id = ${playerId} ;`;

  const playersMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playersMatches.map((eachMatch) =>
      convertMatchObjectToResponseObject(eachMatch)
    )
  );
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchesId } = request.params;

  const getMatchPlayersQuery = `
    SELECT *
    FROM 
        player_match_score NATURAL JOIN player_details
    WHERE
        match_id = ${matchesId};`;

  const playerResponse = await db.all(getMatchPlayersQuery);
  response.send(playerResponse);
});

// API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM
        player_details INNER JOIN player_match_score
        ON player_details.player_id = player_match_score.player_id
    WHERE
        player_details.player_id = ${playerId};`;

  const scoreResponse = await db.all(getPlayerScored);
  response.send(scoreResponse);
});

module.exports = app;

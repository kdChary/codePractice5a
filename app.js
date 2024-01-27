const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dataBasePath = path.join(__dirname, "moviesData.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server Running at "http://localhost:3000/"`);
    });
  } catch (error) {
    console.log(`Data Base Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const changeDbToCamelCase = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

//API 1 to get all the movie names in the table movies
app.get("/movies/", async (request, response) => {
  const getMovieNamesQuery = `SELECT movie_name FROM movie;`;
  const allMovieNames = await db.all(getMovieNamesQuery);
  response.send(allMovieNames.map((name) => changeDbToCamelCase(name)));
});

//API 2 to add movie.
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postPlayerQuery = `
        INSERT INTO movie (director_id, movie_name, lead_actor)
        VALUES (
            ${directorId},'${movieName}','${leadActor}'
        );`;
  await db.run(postPlayerQuery);
  response.send("Movie Successfully Added");
});

//API 3 to get movie based on movie_id
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
        movie_id as movieId,
        director_id as directorId,
        movie_name as movieName,
        lead_actor as leadActor
    FROM 
        movie 
    WHERE
        movie_id = ${movieId};`;
  const gotMovie = await db.get(getMovieQuery);
  response.send(gotMovie);
});

//API 4 Updates the details of a movie in the movie table based on the movie ID
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieQuery = `
        UPDATE 
            movie
        SET
            director_id = ${directorId},
            movie_name = '${movieName}',
            lead_actor = '${leadActor}'
        WHERE 
            movie_id = ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API 5 Deletes a movie from the movie table based on the movie ID
app.delete(`/movies/:movieId/`, async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM 
            movie 
        WHERE 
            movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API 6 Returns a list of all directors in the director table
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT 
            director_id as directorId,
            director_name as directorName
        FROM
            director;`;
  const allDirectorsArray = await db.all(getDirectorsQuery);
  response.send(allDirectorsArray);
});

//API 7 Returns a list of all movie names directed by a specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const moviesQuery = `
    SELECT
        movie.movie_name as movieName
    FROM 
        director NATURAL JOIN movie
    WHERE
        director.director_id = '${directorId}'`;
  const result = await db.all(moviesQuery);
  response.send(result);
});
module.exports = app;

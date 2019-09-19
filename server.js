// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");
var expresshandlebar = require("express-handlebars")
var logger = require("morgan");
var mongoose = require("mongoose");


var db = require("./models");
var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local articles database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/article";

mongoose.connect(MONGODB_URI);


app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));


app.get("/", function(req, res) {
  // res.send("Welcome to the Star Wars Page!")
  res.sendFile(path.join(__dirname, "index.html"));
});


// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
  // Make a request via axios for the news section of `ycombinator`
    axios.get("http://www.bioethics.net/news").then(function (response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    // For each element with a "title" class
    $("div.card").each(function (i, element) {
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children(".card-header")
          .children("a")
          .text();
      result.link = $(this).children(".card-header")
          .children("a")
          .attr("href");
      result.summary = $(this).children(".card-body").text();
      console.log(result);

      
        db.Article.create(result)
          .then(function (dbArticle) {
      
            console.log(dbArticle);
          })
          .catch(function (err) {
      
            console.log(err);
          });
      });

    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
  });
});


// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
    // Find all results from the scrapedData collection in the db
    db.Article.find()
      // Throw any errors to the console
      .then(function(dbPopulate) {
        // If any Libraries are found, send them to the client with any associated Books
        res.json(dbPopulate);
      })
      .catch(function(err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
});


// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
    .then(function(dbPopulate) {
      
      return db.Article.findOneAndUpdate({_id: req.params.id}, { $push: { note: dbPopulate._id } }, { new: true });
    })
    .then(function(dbPopulate) {
      // If the Library was updated successfully, send it back to the client
      res.json(dbPopulate);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});


  // Listen on port 3000
  app.listen(PORT, function () {
    console.log("App running on port " + PORT);
  });


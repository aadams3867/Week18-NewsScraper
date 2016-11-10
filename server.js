/* NewsScraper
 * ================================================== */

// Dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
// Deprecated Promise library fix
var Promise = require('bluebird');
mongoose.Promise=Promise;
// Notice: Our scraping tools are prepared, too
var request = require('request'); 
var cheerio = require('cheerio');

// Use morgan and bodyparser with our app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static('public'));


// Database configuration with Mongoose
mongoose.connect('mongodb://heroku_qg3lvc9n:nii43a2balvcetebnc0b1hq5p5@ds021650.mlab.com:21650/heroku_qg3lvc9n');
var db = mongoose.connection;

// Show any mongoose errors
db.on('error', function(err) {
  console.log('Mongoose Error: ', err);
});

// Once logged in to the db through mongoose, log a success message
db.once('open', function() {
  console.log('Mongoose connection successful.');
});


// And we bring in our Article and Note models
var Article = require('./models/Article.js');
var Note = require('./models/Note.js');

// Routes
// ======

// Simple Index Route
app.get('/', function(req, res) {
  res.send(index.html);
});


// A GET request to scrape the reddit website.
app.get('/scrape', function(req, res) {

  console.log("Heating up the corn popper... Please be patient!");

  // First, we grab the body of the html with request
  request('https://www.reddit.com', function(error, response, html) {
  	// Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);

    // Now, we grab every title within an article tag, and do the following:
    $('p.title').each(function(i, element) {

  		// Save an empty result object
  		var result = {};

  		// Add the text and href of every link, 
  		// and save them as properties of the result obj
  		result.title = $(this).children('a').text();
  		result.link = $(this).children('a').attr('href');

      // If the href links back to reddit (starts with "/"),
      // add "https://www.reddit.com" to the front for a complete link
      if (result.link.substring(0, 1) == "/") {
        result.link = "https://www.reddit.com" + result.link;
      }


  		// Using our Article model, create a new article entry.
  		// Notice the (result):
  		// This effectively passes the result object to the entry (and the title and link)
  		var entry = new Article (result);

    	try {
      	// Now, save that entry to the db
    		entry.save(function(err, doc) {
          console.log(doc);
        });
      } catch (err) {
        // Log any errors
        if (err) {
          console.log(err);
        }
      }      
    });

    // Load the index page
    res.redirect('/');

  });
});


// This will get the articles we scraped from the mongoDB
app.get('/articles', function(req, res){
  Article.find({}, function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });

});


// This will grab an article by its ObjectId
app.get('/articles/:id', function(req, res){
  Article.findOne({ '_id': req.params.id })
  	.exec(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });

});


// Retrieve all notes from the DB, linked to the article
app.get('/allthenotes/:id', function(req, res) {
  // Find all notes in the notes collection
  Note.find({'articleId': req.params.id})
    .exec(function(err, found) {
    // Log any errors
    if (err) {
      console.log(err);
    } else {
      res.json(found);
    }
  });
});



// Make a new note, linked to the article
app.post('/articles/:id', function(req, res){

  var newNote = new Note(req.body);

  newNote.save(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    } else {
      console.log("New Note document successfully saved!");
      console.log("Article ID: " + doc.articleId + "   Note: " + doc.body);
      res.send(doc);
    }
  });

});


// Delete one note from the DB
app.get('/delete/:id', function(req, res) {

  // Remove the one note using the note's _id
  Note.remove({'_id': req.params.id})
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log("One Note document successfully deleted!");
        console.log("Note ID to be deleted: " + req.params.id);
        res.send(doc);
      }
    })
});


// Delete all notes associated with a particular article from the DB
app.get('/deleteall/:id', function(req, res) {
  // Remove all the notes using the article's id
  Note.remove({'articleId': req.params.id})
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        console.log("All the Note documents successfully deleted!");
        console.log("Article ID: " + req.params.id);
        res.send(doc);
      }
    })
});


// Listener
var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('App running on PORT ' + PORT);
});
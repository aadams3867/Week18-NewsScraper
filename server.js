/* NewsScraper
 * ================================================== */

// Dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
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
mongoose.connect('mongodb://localhost/news_scraper');
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

    // If the href is a reddit link (starts with "/"),
    // add "https://www.reddit.com" to the front for a complete link
    if (result.link.substring(0, 1) == "/") {
      result.link = "https://www.reddit.com" + result.link;
    }


		// Using our Article model, create a new entry.
		// Notice the (result):
		// This effectively passes the result object to the entry (and the title and link)
		var entry = new Article (result);

  	try {
    	// Now, save that entry to the db
  		entry.save(function(err, doc) {
  		});
    } catch (err) {
        // Log any errors
        if (err) {
          console.log(err);
        } 
        // or log the doc
        else {
          console.log(doc);
        }
    }

    });
  });
  // Load the index page
  console.log("Scrape complete!");
  res.redirect('/');
});


// This will get the articles we scraped from the mongoDB
app.get('/articles', function(req, res){
  Article.find({}, function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    } 
    // or send the doc to the browser
    else {
      res.json(doc);
    }
  });

});

// This will grab an article by its ObjectId
app.get('/articles/:id', function(req, res){
  Article.findOne({ '_id': req.params.id })
  	.populate('note')
  	.exec(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    } 
    // or send the doc to the browser
    else {
      res.json(doc);
    }
  });

});

// Replace the existing note of an article with a new one
// or if no note exists for an article, make the posted note its new note.
app.post('/articles/:id', function(req, res){

  var newNote = new Note(req.body);

  newNote.save(function(err, doc) {
    // Log any errors
    if (err) {
      console.log(err);
    } 
    // otherwise
    else {
      // Find our article and overwrite the note id into the Article's notes array
      Article.findOneAndUpdate({'_id': req.params.id}, {'note': doc._id})
      	.exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        } 
        // or send the doc to the browser
        else {
          res.send(doc);
        }
      });
    }
  });

});


// Listen on port 3000
app.listen(3000, function() {
  console.log('App running on port 3000!');
});
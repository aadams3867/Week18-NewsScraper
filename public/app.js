// when you click the goScrape button
$(document).on('click', '#goScrape', function(){
  // run a ajax request to scrape the headlines
  $.ajax({
    method: "GET",
    url: "/scrape",
  })
    // with that done
    .done(function( data ) {
      // grab the articles as a json
      $.getJSON('/articles', function(data) {
        // for each one
        for (var i = 0; i<data.length; i++){
          // display the apropos information on the page
          $('#articles').append('<p data-id="' + data[i]._id + '">'+ data[i].title + '<br />'+ data[i].link + '</p>');
        }
      });
    });

});



// grab the articles as a json
$.getJSON('/articles', function(data) {
  // for each one
  for (var i = 0; i<data.length; i++){
    // display the apropos information on the page
    $('#articles').append('<p data-id="' + data[i]._id + '">'+ data[i].title + '<br />'+ data[i].link + '</p>');
  }
});


// whenever someone clicks a p tag
$(document).on('click', 'p', function(){
  // empty the notes from the note section
  $('#notes').empty();
  // save the id from the p tag
  var thisId = $(this).attr('data-id');

  // now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId,
  })
    // with that done, add the note information to the page
    .done(function( data ) {
      console.log(data);
      // the title of the article
      $('#notes').append('<h2>' + data.title + '</h2>'); 
      // a textarea to add a new note body
      $('#notes').append('<textarea id="bodyinput" name="body"></textarea>'); 
      // a button to submit a new note, with the id of the article saved to it
      $('#notes').append('<button data-id="' + data._id + '" id="savenote" class="button">Post note!</button>');
      $('#notes').append('<button data-id="' + data._id + '" id="deletenote" class="button">Send the note to the cornfield!</button>');

      // if there's a note in the article
      if(data.note){
        // place the body of the note in the body textarea
        $('#bodyinput').val(data.note.body);
      }
    });
});

// when you click the savenote button
$(document).on('click', '#savenote', function(){
  // grab the id associated with the article from the submit button
  var thisId = $(this).attr('data-id');

  // run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $('#bodyinput').val() // value taken from note textarea
    }
  })
    // with that done
    .done(function( data ) {
      // log the response
      console.log(data);
    });

  // Also, remove the values entered in the input for note entry
  $('#bodyinput').val("");
});

// when you click the deletenote button
$(document).on('click', '#deletenote', function(){
  // grab the id associated with the article from the submit button
  var thisId = $(this).attr('data-id');

  // Remove the values in the input for note entry
  $('#bodyinput').val("");

  // run a POST request to empty the note
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $('#bodyinput').val() // value taken from note textarea, which was emptied
    }
  })
    // with that done
    .done(function( data ) {
      // log the response
      console.log(data);
    });
});
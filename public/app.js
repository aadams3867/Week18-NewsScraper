// Loads all the notes into the #allnotes div
function getNotes(data){
  // Empty the #allnotes div
  $('#allnotes').empty();

  // Grab all of the current notes associated with that particular article
  $.getJSON('/allthenotes/' + data, function(found) {
    for (var i = 0; i<found.length; i++){
      $('#allnotes').prepend('<p class="dataentry" data-id=' + found[i].articleId + '><span class="notebody" note-id=' + found[i]._id + '>' + found[i].body + '<span class="deleter">X</span></p>');
    }
  })
}


// Make all links open a new tab
$(document).on('click', 'a', function(e){
  e.preventDefault();
  var url = $(this).attr('href');
  window.open(url, '_blank');
});


// When you click the goScrape button,
$(document).on('click', '#goScrape', function(){
  // run a GET request to scrape the headlines
  $.ajax({
    method: "GET",
    url: "/scrape",
  })
    // With that done, grab the articles as a json
    .done(function( data ) {
      $.getJSON('/articles', function(data) {
        // for each one
        for (var i = 0; i<data.length; i++){
          // display the apropos information on the page
          $('#articles').append('<p data-id="' + data[i]._id + '">'+ data[i].title + '<br />'+ (data[i].link).link(data[i].link) + '</p>');
        }
      });
      console.log("Scrape complete!");
    });

});


// When you click a <p> tag,
$(document).on('click', 'p', function(){
  // empty the notes from both notes sections
  $('#notes').empty();
  $('#allnotes').empty();
  // Save the article id from the <p> tag
  var thisId = $(this).attr('data-id');

  // Run a GET request for that particular article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId,
  })
    // With that done, add the add-a-note information to the #notes div
    .done(function( data ) {
      console.log(data);
      // the title of the article
      $('#notes').append('<h2>' + data.title + '</h2>'); 
      // a textarea to add a new note body
      $('#notes').append('<textarea id="bodyinput"></textarea>'); 
      // buttons to submit a new note or delete all notes, with the id of the article saved to them
      $('#notes').append('<button data-id="' + data._id + '" id="saveNote" class="button">Post it!</button>');
      $('#notes').append('<button data-id="' + data._id + '" id="deleteAllNotes" class="button">Send all notes to the cornfield!</button>');

      // Find all notes associated with that article
      getNotes(data._id);
    });
});


// When you click the #saveNote button,
$(document).on('click', '#saveNote', function(){
  // save the article id from the #saveNote button
  var thisId = $(this).attr('data-id');

  // Run a POST request to save the note, using what's entered in the #bodyinput textarea
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      articleId: thisId,
      body: $('#bodyinput').val() // value taken from #bodyinput textarea
    }
  })
    // With that done, add the body of the note and .deleter button to the #allnotes div
    .done(function( note ) {
      $('#allnotes').prepend('<p class="dataentry" data-id=' + note.articleId + '><span class="notebody" note-id=' + note._id + '>' + note.body + '<span class="deleter">X</span></p>');
      console.log("Note: " , note);
    });

  // Also, remove the values entered in the #bodyinput textarea
  $('#bodyinput').val("");
});


// When you click the #deleteAllNotes button,
$(document).on('click', '#deleteAllNotes', function(){
  // save the article id from the #deleteAllNotes button
  var thisId = $(this).attr('data-id');

  // Run a GET request to delete all the notes
  $.ajax({
    method: "GET",
    url: "/deleteall/" + thisId
  })
    // With that done, log the response
    .done(function( data ) {
      console.log("Data: " + data);
    });

  // Also, remove the values entered in the #bodyinput textarea
  $('#bodyinput').val("");
  // and empty the #allnotes div
  $('#allnotes').empty();
});


// When you click the red X .deleter button,
$(document).on('click', '.deleter', function(){
  // empty the #allnotes div    
  $('#allnotes').empty();
  
  // Save the <span> and <p> tag that are parents of the .deleter button
  var selected = $(this).parent();     // the <span>
  var selectedp = selected.parent();   // the <p>
  // save the article id from the <p> tag of that note
  var thisId = selectedp.attr('data-id');
  console.log("thisId: " + thisId);
  // save the note id from the <span> tag of that note
  var thisNoteId = selected.attr('note-id');
  console.log("thisNoteId: " + thisNoteId);

  // Run a GET request to delete that particular note
  $.ajax({
    method: "GET",
    url: "/delete/" + thisNoteId
  })
    // With that done, remove the deleted note from the #allnotes div
    .done(function( data ) {
      selectedp.remove();
    });

  // Also, remove the values entered in the #bodyinput textarea
  $('#bodyinput').val("");
});
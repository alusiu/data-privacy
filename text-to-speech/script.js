try {
  console.log('in the try');
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognition = new SpeechRecognition();
}
catch(e) {
  console.error(e);
  console.log('here');
  $('.no-browser-support').show();
  $('.app').hide();
}

var noteTextarea = $('#note-textarea');
// var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';

var overAllNotes = '';
// Get all notes from previous sessions and display them.
var wordCloudVal = '';
 
// table content stuff 
var date = new Date();

var time = new Date(date),
h = time.getHours(), // 0-24 format
m = time.getMinutes(),
day = 'AM';
if (m < 10) {
  m = '0' + m;
}
if (h > 12) {
  h = h - 12;
  day = 'PM';
}

var dateString = date.toString();
var d = dateString.substr(0,  dateString.indexOf('8')+1); 



// PubNub stuff 
var dataServer;
var pubKey = 'pub-c-eb3b3d9b-4ee9-4557-9a4e-5d00ae3018d0';
var subKey = 'sub-c-dd3d295e-f6a4-11e8-babf-1e3d8cb2a384';
var sendText;
var channelName = "sayStuff";


   // initialize pubnub
   dataServer = new PubNub(
    {
      publish_key   : pubKey,  //get these from the pubnub account online
      subscribe_key : subKey,  
      ssl: true  //enables a secure connection. This option has to be used if using the OCAD webspace
    });

    dataServer.history(
      {
          channel: 'sayStuff',
          count: 10000, // how many items to fetch
          stringifiedTimeToken: true, // false is the default
      },
      function (status, response) {
  
          var msgs = response.messages;
          var start = response.startTimeToken;
          var end = response.endTimeToken;
          // if msgs were retrieved, do something useful with them
          if (msgs != undefined && msgs.length > 0) {
              console.log(msgs.length);
              console.log("start : " + start);
              console.log("end : " + end);
          
          for (var i = 0; i < msgs.length; i++) {
            if (msgs[i].entry.messageText != undefined) {
              overAllNotes += ' '+ msgs[i].entry.messageText;
            }
          }
          wordFrequency(overAllNotes);
        }
          // renderCloud(overAllNotes);

      }
    );

/*-----Fill in the gaps in the info-----*/

$('#date').append('<span> '+ d)+ '</span>';
$('#start').append('<span> '+ h+':'+m+' ' + day + '</span>');

$('#counter').stopwatch().stopwatch('start');

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 

recognition.continuous = true;
//console.log(recognition.continuous)
// This block is called every time the Speech APi captures a line. 
recognition.onresult = function(event) {

   // event is a SpeechRecognitionEvent object.
  // It holds all the lines we have captured so far. 
  // We only need the current one.
  var current = event.resultIndex;

  // Get a transcript of what was said.
  var transcript = event.results[current][0].transcript;
  
  overAllNotes += transcript;
  console.log('in here');
  wordFrequency(overAllNotes);
  sendTheMessage(transcript);
  console.log('T: '+ transcript);
  //console.log('O: '+ overAllNotes);


  // Add the current transcript to the contents of our Note.
  // There is a weird bug on mobile, where everything is repeated twice.
  // There is no official solution so far so we have to handle an edge case.
  var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);

  if(!mobileRepeatBug) {
    noteContent += transcript;
    noteTextarea.val(noteContent);
  }
  recognition.continuous = true;

};

recognition.onstart = function() { 
  console.log("starting");
  // instructions.text('Voice recognition activated. Try speaking into the microphone.');
}
recognition.onend = function() {
  console.log('on end');
  recognition.start();

}
recognition.onspeechend = function() {
  console.log('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
  if(event.error == 'no-speech') {
     console.log('No speech was detected. Try again.');  
  };
}


/*-----------------------------
      App buttons and input 
------------------------------*/

$('#start-record-btn').on('click', function(e) {
  console.log('start');

  if (noteContent.length) {
    noteContent += ' ';
  }
  recognition.start();
  $('#start-record-btn').css('display', 'hidden');
});

// Sync the text inside the text area with the noteContent variable.

noteTextarea.on('input', function() {
  noteContent = $(this).val();
});

notesList.on('click', function(e) {
  e.preventDefault();
  var target = $(e.target);

  // Listen to the selected note.
  if(target.hasClass('listen-note')) {
    var content = target.closest('.note').find('.content').text();
    readOutLoud(content);
  }

  // Delete note.
  if(target.hasClass('delete-note')) {
    var dateTime = target.siblings('.date').text();  
    deleteNote(dateTime);
    target.closest('.note').remove();
  }
});


/**Publishing text */
function sendTheMessage(sendText) {

  // Send Data to the server to draw it in all other canvases
  dataServer.publish(
    {
      channel: channelName,
      message: 
      {
        messageText: sendText      //get the value from the text box and send it as part of the message   
      }
    });

}
/*-----------------------------
      Helper Functions 
------------------------------*/

/*function renderNotes(notes) {
  var html = '';
  if(notes.length) {
    notes.forEach(function(note) {
      html+= `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;    
    });
  }
  else {
    html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
  }
  notesList.html(html);
}*/


function saveNote(dateTime, content) {
  localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
  var notes = [];
  var key;
  for (var i = 0; i < localStorage.length; i++) {
    key = localStorage.key(i);

    if(key.substring(0,5) == 'note-') {
      notes.push({
        date: key.replace('note-',''),
        content: localStorage.getItem(localStorage.key(i))
      });
    } 
  }
  return notes;
}


function deleteNote(dateTime) {
  localStorage.removeItem('note-' + dateTime); 
}


function wordFrequency(content) {

  /* Below is a regular expression that finds alphanumeric characters
     Next is a string that could easily be replaced with a reference to a form control
     Lastly, we have an array that will hold any words matching our pattern */
  var pattern = /\w+/g,
      string = content,
      matchedWords = string.match( pattern );

  /* The Array.prototype.reduce method assists us in producing a single value from an
     array. In this case, we're going to use it to output an object with results. */
  var counts = matchedWords.reduce(function ( stats, word ) {
  var wordList = `a
  about
  above
  after
  all
  also
  and
  as
  at
  be
  because
  but
  by
  can
  come
  could
  day
  do
  even
  find
  first
  for
  from
  get
  give
  go
  have
  he
  her
  here
  him
  his
  how
  I
  if
  in
  into
  it
  its
  just
  know
  let
  like
  look
  make
  man
  many
  me
  more
  my
  new
  no
  not
  now
  of
  on
  one
  only
  or
  other
  our
  out
  people
  say
  see
  she
  so
  some
  something
  somewhere
  take
  tell
  than
  that
  the
  their
  them
  then
  there
  these
  they
  thing
  think
  this
  those
  time
  to
  two
  up
  use
  very
  want
  way
  we
  well
  what
  when
  which
  who
  will
  with
  would
  year
  you
  your
  `;
      /* `stats` is the object that we'll be building up over time.
         `word` is each individual entry in the `matchedWords` array */
      if ( stats.hasOwnProperty( word ) ) {
        var includes = wordList.includes(word);

        if (includes) {
        } else {
          stats[ word ] = stats[ word ] + 1;
        }
          /* `stats` already has an entry for the current `word`.
             As a result, let's increment the count for that `word`. */
          
      } else {
        var includes = wordList.includes(word);
          /* `stats` does not yet have an entry for the current `word`.
             As a result, let's add a new entry, and set count to 1. */
            if (includes) {
            } else {
            stats[ word ] = 1;
        }
      }
 
      /* Because we are building up `stats` over numerous iterations,
         we need to return it for the next pass to modify it. */
         //console.log(stats);
      return stats;

  }, {} );

  var threeWords = getTopThreeWords(counts);
 // sortStats(counts);
  renderCloud(threeWords);

  /* Now that `counts` has our object, we can log it. */
  function renderCloud(threeWords) {
    $('#keywords-js').children().remove();
    $('#keywords-js').append(' </br>');
    for (var i = 0; i < threeWords.length; i++ ) {
      // Add just the word to the topThree array
          $('#keywords-js').append(' <span class="keywords">'+' '+ threeWords[i]+'</span> <br/>'+ ' ');
      }
    }
    recognition.continuous = true;
}
  

function getTopThreeWords(wordObject) {
  // create empty array to store sorted key value pairs
  // need the array to use the js sort method
  let sorted = [];

  // loop over the word object and put each word and its frequency in the array
  for (let word in wordObject) {
    sorted.push([word, wordObject[word]]);
  }

  // use the js sort function on the array to reorganize the array in descending value
  sorted.sort(function(a, b) {
    return b[1] - a[1];
  });

  // create empty array to hold top three words
  let topThree = [];

  // short hand loop for doing something 3 times
  [1,2,3,4,5].forEach(function(i) {
    // Add just the word to the topThree array
    topThree.push(sorted[i - 1][0]);
  });

  return topThree;
}

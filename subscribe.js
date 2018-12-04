/*
 * Creation & Computation - Digital Futures, OCAD University
 * Kate Hartman / Nick Puckett
 * 
 * Basic PubNub example for sending messages to the other browser sessions that are open
 * Enter text into the textbox and hit Post Message
 * The text is sent to all open sessions, the size and location of the text is randomized for each browser locally 
 */

// server variables

var dataServer;
//var pubKey = 'pub-c-8b0a0cf3-95ea-4548-9789-6f418cb6c8dc';
var subKey = 'sub-c-5c05ce6e-a685-11e8-a6fb-8693ddbf4771';

//input variables
var sendText;
var sendButton;

//name used to sort your messages. used like a radio station. can be called anything
var channelName = "feed";

// initialize pubnub
dataServer = new PubNub(
{
// publish_key   : pubKey,  //get these from the pubnub account online
subscribe_key : subKey,  
ssl: true  //enables a secure connection. This option has to be used if using the OCAD webspace
});

//attach callbacks to the pubnub object to handle messages and connections
dataServer.addListener({ message: readIncoming, presence: whoisconnected })
dataServer.subscribe({channels: [channelName]});

///uses built in mouseClicked function to send the data to the pubnub server
function sendTheMessage() {
 

  // Send Data to the server to draw it in all other canvases
  dataServer.publish(
    {
      channel: channelName,
      message: 
      {
        messageText: sendText.value()       //get the value from the text box and send it as part of the message   
      }
    });

}

function readIncoming(inMessage) //when new data comes in it triggers this function, 
{                               // this works becsuse we subscribed to the channel in setup()
  
  // simple error check to match the incoming to the channelName
  if(inMessage.channel == channelName)
  {
    background(255);
    noStroke();
    fill(0);  //read the color values from the message
    textSize(80)
    text(inMessage.message.messageText, 5, height/2);
  }
}

function whoisconnected(connectionInfo)
{

}
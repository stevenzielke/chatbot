// Add your requirements
var restify = require('restify'); 
var builder = require('botbuilder'); 
var math = require('mathjs');
var locationDialog = require('botbuilder-location');
var locationService = require("./bing-geospatial-service.js");
var map_card_1 = require("./map-card");
var MAX_CARD_COUNT = 5;
//var defaultLocationDialog = require("./node_modules/botbuilder-location/lib/dialogs/default-location-dialog");

var tuev = require('./tuev.js');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.PORT || 3000, function() 
{
   console.log('%s listening to %s', server.name, server.url); 
});

function firstRun(session) {
  console.log('This user is running our bot the first time')
  createUser(session)
  platforms.firstRun(session.message.user.id, session.message.address.channelId)
    .then((values) => {
      for (let value of values) {
        if (value.data.firstName && value.data.lastName) {
          session.userData.user.profile = value.data
        }
      }
    })
    .catch((errors => {
      console.log(errors);
    }))
  reply(session)
  session.endDialog()
}


// Create chat bot
var connector = new builder.ChatConnector
({ appId: process.env.MY_APP_ID, appPassword: process.env.MY_APP_PASSWORD }); 
var bot = new builder.UniversalBot(connector);
bot.library(locationDialog.createLibrary(process.env.BING_API_KEY));
server.post('/api/messages', connector.listen());

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('goodbye', 'Goodbye :)', { matches: /^goodbye/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

// Create bot dialogs
bot.dialog('/', 
    function (session) {
        var card = new builder.HeroCard(session)
                .title("HU / AU Planer")
                 .text("ich helfe Ihnen dabei einen Termin zur HU/AU zu vereinbaren.")
                 .images([
                    builder.CardImage.create(session, "http://www.mobilapp.io/wp-content/uploads/2017/04/huau.jpg")
                ]);
        var msg = new builder.Message(session).attachments([card]);
        session.send(msg);
        session.beginDialog('/huaumenu');
    }
);

bot.dialog('/huaumenu', [
    function (session) {
        builder.Prompts.choice(session, "Wie kann ich Ihnen helfen? Mit einer Hauptuntersuchung (HU), oder einer Abgasuntersuchung (AU)?", "HU|AU|test|(abbrechen)");
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
        session.replaceDialog('/huaumenu');
    }
]);

bot.dialog('/test', [
    function (session) {

        locationService.getLocationByQuery(process.env.BING_API_KEY, "Neustadt").then(function (locations) {
            if (locations.length == 0) {
                session.send(consts_1.Strings.LocationNotFound).sendBatch();
                return;
            }
            var locationCount = Math.min(MAX_CARD_COUNT, locations.length);
            locations = locations.slice(0, locationCount);
            var reply = createLocationsCard(process.env.BING_API_KEY, session, locations);
            session.send(reply);
            session.endDialogWithResult({ response: { locations: locations } });
           })

    }
]);



bot.dialog('/HU', [
function (session) {
        builder.Prompts.text(session, "Wo möchten Sie denn die Hauptuntersuchung durchführen? Bitte geben Sie Ihren Standort oder eine Adresse ein und ich schlage eine TÜV Station in der Nähe vor.");
    },
    function (session, results) {
        var ort = results.response;
        session.send("Einen Moment. Ich suche nach einer TÜV Station in der Nähe der Adresse: " + ort);
        if(session.message.entities.length != 0){
            session.userData.lat = session.message.entities[0].geo.latitude;
            session.userData.lon = session.message.entities[0].geo.longitude;
            var tmp = JSON.stringify(session.message.entities[0].geo)
        } else {
            //session.endDialog("Sorry, I didn't get your location.");
            var closestStation;
            tuev.getClosestStation(ort,function(closestStation){
                session.send("Die folgende TÜV Station ist am nächsten zu dem Standort: " + closestStation.address);
            });
        }
        
        var tmp;

    }
]);


bot.dialog("/AU", [
    function (session) {

        locationDialog.getLocation(session, {
            prompt: "Ich suche für Sie die TÜV Station in Ihrer Nähe. Bitte geben Sie den Standort an, in dessen Nähe wir suchen sollen.",
            requiredFields: 
                //locationDialog.LocationRequiredFields.streetAddress |
                locationDialog.LocationRequiredFields.locality |
                //locationDialog.LocationRequiredFields.region |
                locationDialog.LocationRequiredFields.postalCode |
                locationDialog.LocationRequiredFields.country
        });
    },
    function (session, results) {
        if (results.response) {
            var place = results.response;
            session.send(place.streetAddress + ", " + place.locality + ", " + place.region + ", " + place.country + " (" + place.postalCode + ")");
        }
        else {
            session.send("OK, I won't be shipping it");
        }
    }
]);



server.get('/', restify.serveStatic({
 directory: __dirname,
 default: '/index.html'
}));







function createLocationsCard(apiKey, session, locations) {
    var cards = new Array();
    for (var i = 0; i < locations.length; i++) {
        cards.push(constructCard(apiKey, session, locations, i));
    }
    return new builder.Message(session)
        .attachmentLayout(builder.AttachmentLayout.carousel)
        .attachments(cards);
}
function constructCard(apiKey, session, locations, index) {
    var location = locations[index];
    var card = new map_card_1.MapCard(apiKey, session);
    if (locations.length > 1) {
        card.location(location, index + 1);
    }
    else {
        card.location(location);
    }
    return card;
}
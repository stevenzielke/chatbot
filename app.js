// Add your requirements
var restify = require('restify'); 
var builder = require('botbuilder'); 

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.PORT || 3000, function() 
{
   console.log('%s listening to %s', server.name, server.url); 
});

var tuevStations = {};
tuevStations["stations"] = [];
function createTUEVStationsArr () {
    var data = {
        lat: '53.4903476',
        lng: '10.2026361',
        address: 'Bergedorfer Straße 74, 21033 Hamburg'
    };
    tuevStations["stations"].push(data);
    data = {
        lat: '48.44719',
        lng: '11.13818',
        address: 'Rudolf-Diesel-Str. 3, 86551 Aichach'
    };
    tuevStations["stations"].push(data);


}
createTUEVStationsArr();
console.log(tuevStations);

function getGeo(ort) {
    // setup Google Maps

    var googleMapsClient = require('@google/maps').createClient({
        key: 'AIzaSyBn6M9Sl3K4tRn0QbkqN5QPSdHoNMIvndw'
    });
    googleMapsClient.geocode({
        address: ort
        }, function(err, response) {
        if (!err) {
            for(var i = 0; i < response.json.results.length; i++) {
                if (response.json.results[i].geometry) {
                    var lat = response.json.results[i].geometry.location.lat;
                    var lng = response.json.results[i].geometry.location.lng;
                    console.log(lat);
                    console.log(lng);
                 }
            }
    
            var util = require("util");
            //console.log(JSON.stringify(response, null, 4))
        } else {
            //console.log(err);
        }
        }
    );
   
}










// Create chat bot
var connector = new builder.ChatConnector
({ appId: process.env.MY_APP_ID, appPassword: process.env.MY_APP_PASSWORD }); 
var bot = new builder.UniversalBot(connector);
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
    //session.send(session.userData.name);
    session.beginDialog('/huaumenu');
});

bot.dialog('/huaumenu', [
    function (session) {
        builder.Prompts.choice(session, "Wie kann ich Ihnen helfen? Mit einer Hauptuntersuchung (HU), oder einer Abgasuntersuchung (AU)?", "HU|AU|(abbrechen)");
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
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });



bot.dialog('/HU', [
function (session) {
        builder.Prompts.text(session, "Wo möchten Sie denn die Hauptuntersuchung durchführen? Bitte geben Sie die PLZ oder Adresse ein und ich schlage eine TÜV Station in der Nähe vor.");
        //session.send("Wo möchten Sie denn die Hauptuntersuchung durchführen? Bitte geben Sie die PLZ oder Adresse ein und ich schlage eine TÜV Station in der Nähe vor.");
    },
    function (session, results) {
        var ort = results.response;
        session.send("Einen Moment. Ich suche nach einer TÜV Station in der Nähe der Adresse: " + ort);

        //if(Number(ort) = 'NaN')
        //{
        //    session.send("Einen Moment. Ich suche nach einer TÜV Station in der Nähe der Adresse: " + ort);
        //} else {
        //    session.send("Einen Moment. Ich suche nach einer TÜV Station in der Nähe der PLZ: " + ort);
        //}
        getGeo(ort);
       // builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?"); 
    }
]);


server.get('/', restify.serveStatic({
 directory: __dirname,
 default: '/index.html'
}));
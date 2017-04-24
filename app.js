// Add your requirements
var restify = require('restify'); 
var builder = require('botbuilder'); 
var math = require('mathjs');
var locationDialog = require('botbuilder-location');
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
var closestIndex;
console.log(tuevStations);

function getGeo(ort, session) {
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
                    //console.log(lat);
                    //console.log(lng);
                 }
            }
            
            var closestDist;
            for(var i = 0; i < tuevStations["stations"].length; i++) {
                    var latDelta = tuevStations["stations"][i].lat - lat;
                    var lngDelta = tuevStations["stations"][i].lng - lng;
                    var dist = math.sqrt(latDelta*latDelta + lngDelta*lngDelta);
                    if(!closestDist || dist < closestDist) {
                        closestDist = dist;
                        closestIndex = i;
                    }
            }
//console.log("hhh: " + closestIndex);
//var test = tuevStations["stations"][closestIndex];
    //var closestTUEV = tuevStations["stations"][closestIndex].address;
   session.send("Die folgende TÜV Station ist am nächsten zu dem Standort: " + tuevStations["stations"][closestIndex].address);

        } else {
            //console.log(err);
        }
        }
    );
}




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
bot.library(locationDialog.createLibrary("AoLS-Qbf5Xqrf_OoH7QHYR07T6n587pv_9hQDkOdq6O59OH5Fz6vQ39g2h2sO4sq"));

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
        builder.Prompts.text(session, "Wo möchten Sie denn die Hauptuntersuchung durchführen? Bitte geben Sie Ihren Standort oder eine Adresse ein und ich schlage eine TÜV Station in der Nähe vor.");
        //session.send("Wo möchten Sie denn die Hauptuntersuchung durchführen? Bitte geben Sie die PLZ oder Adresse ein und ich schlage eine TÜV Station in der Nähe vor.");
    },
    function (session, results) {
        var ort = results.response;
        session.send("Einen Moment. Ich suche nach einer TÜV Station in der Nähe der Adresse: " + ort);
        if(session.message.entities.length != 0){
            session.userData.lat = session.message.entities[0].geo.latitude;
            session.userData.lon = session.message.entities[0].geo.longitude;
            var tmp = JSON.stringify(session.message.entities[0].geo)
            session.endDialog("Bin hier angekommen." + tmp);
        }else{
            session.endDialog("Sorry, I didn't get your location.");
        }

        getGeo(ort, session);


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
// Add your requirements
var restify = require('restify'); 
var builder = require('botbuilder'); 

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.PORT || 3000, function() 
{
   console.log('%s listening to %s', server.name, server.url); 
});

//var appId = process.env.MY_APP_ID,
//var appPassword = process.env.MY_APP_PASSWORD;

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
                 builder.CardImage.create(session, "https://mobilapp-chatbot.azurewebsites.net/images/huau.jpg")
            ]);
        var msg = new builder.Message(session).attachments([card]);
    session.send(msg);
    //session.send(session.userData.name);
    session.send("Wie kann ich Ihnen helfen? Mit einer HU, oder einer AU?");
    session.beginDialog('/menu');
});

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "Wie kann ich IHnen helfen? Mit einer HU, oder einer AU?", "HU|AU|(abbrechen)");
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
        session.replaceDialog('/menu');
    }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });


server.get('/', restify.serveStatic({
 directory: __dirname,
 default: '/index.html'
}));
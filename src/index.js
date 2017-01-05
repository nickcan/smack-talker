'use strict';
var Alexa = require('alexa-sdk');
var APP_ID = undefined;  // TODO replace with your app ID (OPTIONAL).

var languageStrings = {
    "en-US": {
        "translation": {
            "INSULTS": [
                "You're not gonna make this shot! You Jackass!",
                "Your six cup game is week.",
                "You couldn't hit the back side of a barn with a ping pong ball.",
                "You think you're good, you ain't. So go fuuck yourself",
                "Sweet baby Jesus, your beer pong game is so fuuucking bad",
                "You gonna win? Nope. Gonna sit under the table? Yep!",
                "You may not be the worst in the house, but you aren't the best. Nick is."
            ],
            "SKILL_NAME" : "American Insults",
            "GET_INSULT_MESSAGE" : "Here's your Insult: ",
            "HELP_MESSAGE" : "You can say talk shit, or, you can say exit... What can I help you with?",
            "HELP_REPROMPT" : "What can I help you with?",
            "STOP_MESSAGE" : "Goodbye!"
        }
    },
};

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function() {
        this.emit('TalkShit');
    },
    'GetNewInsultIntent': function() {
        this.emit('TalkShit');
    },
    'GetNewInsultWithNameIntent': function() {
        var insultsArr = this.t('INSULTS');
        var insultIndex = Math.floor(Math.random() * insultsArr.length);
        var randomInsult = insultsArr[insultIndex];

        var name = this.event.request.intent.slots.Name.value;

        var speechOutput = "Hey " + name + ", " + randomInsult;

        this.emit(':tellWithCard', speechOutput, this.t("SKILL_NAME"), randomInsult)
    },
    'TalkShit': function() {
        // Get a random space Insult from the space Insults list
        // Use this.t() to get corresponding language data
        var insultsArr = this.t('INSULTS');
        var insultIndex = Math.floor(Math.random() * insultsArr.length);
        var randomInsult = insultsArr[insultIndex];

        // Create speech output
        this.emit(':tellWithCard', randomInsult, this.t("SKILL_NAME"), randomInsult)
    },
    'AMAZON.HelpIntent': function() {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    },
    'AMAZON.StopIntent': function() {
        this.emit(':tell', this.t("STOP_MESSAGE"));
    }
};

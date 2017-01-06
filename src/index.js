"use strict";
var Alexa = require("alexa-sdk");
var APP_ID = undefined;

var languageStrings = {
    "en-US": {
        "translation": {
            "INSULTS": {
                default: [
                    "Two wrongs don't make a right, take your parents as an example.",
                    "I'd like to see things from your point of view but I can't seem to get my head that far up my ass.",
                    "It's better to let someone think you are an Idiot than to open your mouth and prove it.",
                    "You must have been born on a highway because that's where most accidents happen.",
                    "If laughter is the best medicine, your face must be curing the world.",
                    "I wasn't born with enough middle fingers to let you know how I feel about you."
                ],
                showtime: [
                    "your showtime game is weak bitch",
                    "I'm surprised you ever make free throws with a green zone that small",
                    "You're not gonna make this shot! You Jackass!",
                    "You think you're good? You're not. So go fuck yourself",
                    "How does the ground feel? Fuck head"
                ]
            },
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
    "LaunchRequest": function() {
        this.emit("TalkShit");
    },
    "GetNewInsultIntent": function() {
        this.emit("TalkShit");
    },
    "GetNewInsultWithNameIntent": function() {
        var insultsArr = this.t("INSULTS").default;
        var insultIndex = Math.floor(Math.random() * insultsArr.length);
        var randomInsult = insultsArr[insultIndex];

        var name = this.event.request.intent.slots.Name.value;

        var speechOutput = "Hey " + name + ", " + randomInsult;

        this.emit(":tellWithCard", speechOutput, this.t("SKILL_NAME"), randomInsult)
    },
    "GetNewInsultWithNameAndCategoryIntent": function() {
        var category = this.event.request.intent.slots.Category.value;

        var insultsArr = this.t("INSULTS")[category];
        var insultIndex = Math.floor(Math.random() * insultsArr.length);
        var randomInsult = insultsArr[insultIndex];

        var name = this.event.request.intent.slots.Name.value;

        var speechOutput = "Hey " + name + ", " + randomInsult;

        this.emit(":tellWithCard", speechOutput, this.t("SKILL_NAME"), randomInsult)
    },
    "GetNewInsultWithCategoryIntent": function() {
        var category = this.event.request.intent.slots.Category.value;

        var insultsArr = this.t("INSULTS")[category];
        var insultIndex = Math.floor(Math.random() * insultsArr.length);
        var randomInsult = insultsArr[insultIndex];

        var speechOutput = randomInsult;

        this.emit(":tellWithCard", speechOutput, this.t("SKILL_NAME"), randomInsult)
    },
    "TalkShit": function() {
        var insultsArr = this.t("INSULTS").default;
        var insultIndex = Math.floor(Math.random() * insultsArr.length);
        var randomInsult = insultsArr[insultIndex];

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult)
    },
    "AMAZON.HelpIntent": function() {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_MESSAGE");

        this.emit(":ask", speechOutput, reprompt);
    },
    "AMAZON.CancelIntent": function() {
        this.emit(":tell", this.t("STOP_MESSAGE"));
    },
    "AMAZON.StopIntent": function() {
        this.emit(":tell", this.t("STOP_MESSAGE"));
    }
};

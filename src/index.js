"use strict";

var Alexa = require("alexa-sdk");
var APP_ID = undefined;

var languageStrings = {
    "en-US": {
        "translation": {
            "INSULTS": {
                default: [
                    "Two wrongs don't make a right, take your parents as an example.",
                    "It's better to let someone think you are an Idiot than to open your mouth and prove it.",
                    "I wasn't born with enough middle fingers to let you know how I feel about you.",
                    "Fuuck you! That's right you heard me. Fuuck you!",
                    "I'm jealous of people that don't know you. You're so fucking stupid.",
                    "You're the reason they need to put instructions on shampoo bottles.",
                    "Because of you, the gene pool needs a lifeguard.",
                    "I'd love to see things from your perspective, but I don't think I could shove my head that far up my ass."
                ],
                showtime: [
                    "your showtime game is weak you fucking bitch",
                    "I'm surprised you ever make free throws with a green zone that small",
                    "Is your three point setting at 0? You're fucking horrible",
                    "You're not gonna make this shot! You Jackass!",
                    "You think you're good at Showtime? You're not. So go fuck yourself",
                    "How does the ground feel? You Fucking shit head",
                    "You should let your chair play, at least it knows how to support.",
                    "You're the human equivalent of a participation award.",
                    "You know all those times your parents said video games would get you nowhere? They were right."
                ],
                golf: [
                    "Nice shot, asshole",
                    "Are they building a Wallmart here?"
                ],
                "fantasy football": [
                    "Your team has more stains in its underpants than Rosie O'Donnel with food poisining",
                    "You going to pick Philip Rivers again? You're such a fucking piece of shit"
                ]
            },
            "SKILL_NAME": "Shit Talker",
            "WELCOME_MESSAGE": "Hello, My name is Shit Talker. I'll talk shiit to people for you. What would you like me to say?",
            "HELP_MESSAGE": "You can say things like talk shiit or speak, and also add a name, category, or both. What would you like me to say",
            "HELP_REPROMPT": "What would you like me to say",
            "STOP_MESSAGE": "Later Asshole"
        }
    },
};

// "I simply want to inform you that Evan lost in the Finals this year. Hip Hip Hooray! He's a fucking loser.",

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var grabRandomInsult = function(insultsArr, category) {
    var insultIndex = Math.floor(Math.random() * insultsArr.length);
    return insultsArr[insultIndex];
};

var isMasterName = function(name) {
    return name.toLowerCase() === "nick" || name.toLowerCase() === "nicholas";
};

var constructSpeechOuput = function(name, insult) {
    if (isMasterName(name)) {
        return "I don't talk shit to Nick. I've learned not to bite the hand that feeds you. So go fuck yourself."
    }
    return "Hey " + name + ", " + insult;
};

var handlers = {
    "LaunchRequest": function() {
        var speechOutput = this.t("WELCOME_MESSAGE");
        var reprompt = this.t("HELP_REPROMPT");

        this.emit(":ask", speechOutput, reprompt);
    },
    "GetNewInsultIntent": function() {
        this.emit("TalkShit");
    },
    "TalkShit": function() {
        var insultsArr = this.t("INSULTS").default;

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult)
    },
    "GetNewInsultWithCategoryIntent": function() {
        var category = this.event.request.intent.slots.Category.value;
        var insultsArr = this.t("INSULTS")[category];
        var randomInsult = grabRandomInsult(insultsArr);

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult)
    },
    "GetNewInsultWithNameIntent": function() {
        var insultsArr = this.t("INSULTS").default;
        var randomInsult = grabRandomInsult(insultsArr);

        var name = this.event.request.intent.slots.Name.value;

        this.emit(":tellWithCard", constructSpeechOuput(name, randomInsult), this.t("SKILL_NAME"), randomInsult)
    },
    "GetNewInsultWithNameAndCategoryIntent": function() {
        var category = this.event.request.intent.slots.Category.value;
        var insultsArr = this.t("INSULTS")[category];
        var randomInsult = grabRandomInsult(insultsArr);

        var name = this.event.request.intent.slots.Name.value;

        this.emit(":tellWithCard", constructSpeechOuput(name, randomInsult), this.t("SKILL_NAME"), randomInsult)
    },
    "AMAZON.HelpIntent": function() {
        var speechOutput = this.t("HELP_MESSAGE");
        var reprompt = this.t("HELP_REPROMPT");

        this.emit(":ask", speechOutput, reprompt);
    },
    "AMAZON.CancelIntent": function() {
        this.emit(":tell", this.t("STOP_MESSAGE"));
    },
    "AMAZON.StopIntent": function() {
        this.emit(":tell", this.t("STOP_MESSAGE"));
    }
};

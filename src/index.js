"use strict";

var async = require("asyncawait/async");
var await = require("asyncawait/await");

var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");

var SMACK_TALKER_APP_ID = process.env.SMACK_TALKER_APP_ID;

var docClient = new AWS.DynamoDB.DocumentClient({region: "us-east-1"})

var languageStrings = {
    "en-US": {
        "translation": {
            "SKILL_NAME": "Smack Talker",
            "WELCOME_MESSAGE": "Hello, My name is Smack Talker. I'll talk smack to people for you. What would you like me to say?",
            "HELP_MESSAGE": "You can say things like talk smack or speak to any first name, about a category, or both. What would you like me to say?",
            "HELP_REPROMPT": "What would you like me to say ass hole?",
            "STOP_MESSAGE": "Later ass hole"
        }
    },
};

var constructDynamoInsultsTableParams = function(category) {
    return {
        TableName : "Insults",
        Key: {
            category: category || "default"
        }
    };
};

var grabRandomInsult = function(insultsArr, lastItem) {
    var insultIndex = Math.floor(Math.random() * insultsArr.length);
    var randomInsult = insultsArr[insultIndex];
    if (insultsArr.length > 1 && lastItem && lastItem.lastInsult.message === randomInsult) {
        return grabRandomInsult(insultsArr, lastItem);
    } else {
        return randomInsult;
    }
};

var constructSpeechOutput = function(name, insult) {
    if (name) {
        return "Hey " + name + ", " + insult;
    } else {
        return insult;
    }
};

var constructUpdateApplicationParams = function(opts) {
    return {
        Item: {
            id: opts.userId,
            lastInsult: {
                category: opts.category,
                message: opts.insult,
                name: opts.name || null,
                timestamp: opts.timestamp
            }
        },
        TableName : "Applications"
    };
};

var getApplication = function(userId) {
    var params = {
        TableName: "Applications",
        Key: {
            id: userId
        }
    };

    var requestPromise = docClient.get(params).promise();
    return requestPromise.then(function(data) { return data });
};

var updateApplication = function(opts) {
    var params = constructUpdateApplicationParams(opts);
    var requestPromise = docClient.put(params).promise();
    return requestPromise.then(function(data) { return data });
};

var getInsult = function(category) {
    var params = constructDynamoInsultsTableParams(category);
    var requestPromise = docClient.get(params).promise();
    return requestPromise.then(function(data) { return data });
};

var determineInsult = async(function(opts) {
    var applicationResponse = await(getApplication(opts.userId));

    var insultResponse = await(getInsult(opts.category));
    var randomInsult = grabRandomInsult(insultResponse.Item.insults, applicationResponse.Item);

    var updateOptions = {
        category: insultResponse.Item.category,
        insult: randomInsult,
        name: opts.name,
        timestamp: opts.timestamp,
        userId: opts.userId
    };

    await(updateApplication(updateOptions));

    return constructSpeechOutput(opts.name, randomInsult);
});

exports.handler = function(event, context, callback) {
    if (event.session.application.applicationId !== SMACK_TALKER_APP_ID) {
        throw new Error("Incorrect application ID");
    }

    var alexa = Alexa.handler(event, context);
    alexa.appId = SMACK_TALKER_APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    "LaunchRequest": function() {
        var speechOutput = this.t("WELCOME_MESSAGE");
        var reprompt = this.t("HELP_REPROMPT");

        this.emit(":ask", speechOutput, reprompt);
    },
    "GetNewInsultIntent": async(function() {
        var userId = this.event.session.user.userId;
        var timestamp = this.event.request.timestamp;

        var insultOpts = {
            timestamp: timestamp,
            userId: userId
        };

        var insult = await(determineInsult(insultOpts));

        this.emit(":tellWithCard", insult, this.t("SKILL_NAME"), insult);
    }),
    "GetNewInsultWithCategoryIntent": async(function() {
        var userId = this.event.session.user.userId;
        var category = this.event.request.intent.slots.Category.value.toLowerCase();
        var timestamp = this.event.request.timestamp;

        var insultOpts = {
            category: category,
            timestamp: timestamp,
            userId: userId
        };

        var insult = await(determineInsult(insultOpts));

        this.emit(":tellWithCard", insult, this.t("SKILL_NAME"), insult);
    }),
    "GetNewInsultWithNameIntent": async(function() {
        var userId = this.event.session.user.userId;
        var name = this.event.request.intent.slots.Name.value;
        var timestamp = this.event.request.timestamp;

        var insultOpts = {
            name: name,
            timestamp: timestamp,
            userId: userId
        };

        var insult = await(determineInsult(insultOpts));

        this.emit(":tellWithCard", insult, this.t("SKILL_NAME"), insult);
    }),
    "GetNewInsultWithNameAndCategoryIntent": async(function() {
        var userId = this.event.session.user.userId;
        var category = this.event.request.intent.slots.Category.value.toLowerCase();
        var name = this.event.request.intent.slots.Name.value;
        var timestamp = this.event.request.timestamp;

        var insultOpts = {
            category: category,
            name: name,
            timestamp: timestamp,
            userId: userId
        };

        var insult = await(determineInsult(insultOpts));

        this.emit(":tellWithCard", insult, this.t("SKILL_NAME"), insult);
    }),
    "RepeatLastSpokenInsultIntent": async(function() {
        var userId = this.event.session.user.userId;
        var timestamp = this.event.request.timestamp;
        var applicationResponse = await(getApplication(userId));
        var item = applicationResponse.Item;

        if (item && item.lastInsult.category && item.lastInsult.message) {
            var message = "From the " + item.lastInsult.category + " category. " + constructSpeechOutput(item.lastInsult.name, item.lastInsult.message);
            this.emit(":tellWithCard", message, this.t("SKILL_NAME"), message);
        } else {
            var message = "Sorry, there has not been an insult saved for your application yet. Please tell Smack Talker to send and insult.";
            this.emit(":tellWithCard", message, this.t("SKILL_NAME"), message);
        }
    }),
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

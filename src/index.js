"use strict";

var async = require("asyncawait/async");
var await = require("asyncawait/await");

var Alexa = require("alexa-sdk");
var APP_ID = undefined;

var AWS = require("aws-sdk");
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

var constructUpdateApplicationParams = function(userId, category, insult, timestamp, name) {
    return {
        TableName : "Applications",
        Item: {
            id: userId,
            lastInsult: {
                category: category,
                message: insult,
                name: name,
                timestamp: timestamp
            }
        }
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

var updateApplication = function(userId, category, insult, timestamp, name) {
    var params = constructUpdateApplicationParams(userId, category, insult, timestamp, name);
    var requestPromise = docClient.put(params).promise();
    return requestPromise.then(function(data) { return data });
};

var getInsult = function(category) {
    var params = constructDynamoInsultsTableParams(category);
    var requestPromise = docClient.get(params).promise();
    return requestPromise.then(function(data) { return data });
};

var determineInsult = async(function(userId, category, name, timestamp) {
    var applicationResponse = await(getApplication(userId));

    var insultResponse = await(getInsult(category));
    var randomInsult = grabRandomInsult(insultResponse.Item.insults, applicationResponse.Item);

    await(updateApplication(userId, insultResponse.Item.category, randomInsult, timestamp, name));

    return constructSpeechOutput(name, randomInsult);
});

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
        var speechOutput = this.t("WELCOME_MESSAGE");
        var reprompt = this.t("HELP_REPROMPT");

        this.emit(":ask", speechOutput, reprompt);
    },
    "GetNewInsultIntent": async(function() {
        var userId = this.event.session.user.userId;
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(userId, null, null, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
    }),
    "GetNewInsultWithCategoryIntent": async(function() {
        var userId = this.event.session.user.userId;
        var category = this.event.request.intent.slots.Category.value.toLowerCase();
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(userId, category, null, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
    }),
    "GetNewInsultWithNameIntent": async(function() {
        var userId = this.event.session.user.userId;
        var name = this.event.request.intent.slots.Name.value;
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(userId, null, name, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
    }),
    "GetNewInsultWithNameAndCategoryIntent": async(function() {
        var userId = this.event.session.user.userId;
        var category = this.event.request.intent.slots.Category.value.toLowerCase();
        var name = this.event.request.intent.slots.Name.value;
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(userId, category, name, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
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

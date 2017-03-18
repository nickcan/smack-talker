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
            "HELP_MESSAGE": "You can say things like talk shiit or speak, and also add a name, category, or both. What would you like me to say",
            "HELP_REPROMPT": "What would you like me to say",
            "STOP_MESSAGE": "Later Asshole"
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

var isChuckNorris = function(name) {
    return name.toLowerCase() === "chuck norris";
};

var constructSpeechOuputWithName = function(name, insult) {
    if (isChuckNorris(name)) {
        return "Even I know better than to talk smack to chuck norris."
    }

    return "Hey " + name + ", " + insult;
};

var constructUpdateApplicationParams = function(applicationId, category, insult, timestamp) {
    return {
        TableName : "Applications",
        Item: {
            id: applicationId,
            lastInsult: {
                category: category,
                message: insult,
                timestamp: timestamp
            }
        }
    };
};

var getApplication = function(applicationId) {
    var params = {
        TableName: "Applications",
        Key: {
            id: applicationId
        }
    };

    var requestPromise = docClient.get(params).promise();
    return requestPromise.then(function(data) { return data });
};

var updateApplication = function(applicationId, category, insult, timestamp) {
    var params = constructUpdateApplicationParams(applicationId, category, insult, timestamp);
    var requestPromise = docClient.put(params).promise();
    return requestPromise.then(function(data) { return data });
};

var getInsult = function(category) {
    var params = constructDynamoInsultsTableParams(category);
    var requestPromise = docClient.get(params).promise();
    return requestPromise.then(function(data) { return data });
};

var determineInsult = async(function(applicationId, category, name, timestamp) {
    var applicationResponse = await(getApplication(applicationId));

    var insultResponse = await(getInsult(category));
    var randomInsult = grabRandomInsult(insultResponse.Item.insults, applicationResponse.Item);

    await(updateApplication(applicationId, insultResponse.Item.category, randomInsult, timestamp));

    if (name) {
        return constructSpeechOuputWithName(name, randomInsult);
    } else {
        return randomInsult;
    }
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
        var applicationId = this.event.session.application.applicationId;
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(applicationId, null, null, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
    }),
    "GetNewInsultWithCategoryIntent": async(function() {
        var applicationId = this.event.session.application.applicationId;
        var category = this.event.request.intent.slots.Category.value.toLowerCase();
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(applicationId, category, null, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
    }),
    "GetNewInsultWithNameIntent": async(function() {
        var applicationId = this.event.session.application.applicationId;
        var name = this.event.request.intent.slots.Name.value;
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(applicationId, null, name, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
    }),
    "GetNewInsultWithNameAndCategoryIntent": async(function() {
        var applicationId = this.event.session.application.applicationId;
        var category = this.event.request.intent.slots.Category.value.toLowerCase();
        var name = this.event.request.intent.slots.Name.value;
        var timestamp = this.event.request.timestamp;
        var randomInsult = await(determineInsult(applicationId, category, name, timestamp));

        this.emit(":tellWithCard", randomInsult, this.t("SKILL_NAME"), randomInsult);
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

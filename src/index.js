"use strict";

var async = require("asyncawait/async");
var await = require("asyncawait/await");

var Alexa = require("alexa-sdk");
var AWS = require("aws-sdk");

var SMACK_TALKER_APP_ID = process.env.SMACK_TALKER_APP_ID;

var docClient = new AWS.DynamoDB.DocumentClient({region: "us-east-1"});

var LANGUAGE_STRINGS = {
    "en-US": {
        "translation": {
            "SKILL_NAME": "Smack Talker",
            "WELCOME_MESSAGE": "Hello, My name is Smack Talker. I'll talk smack to people for you. What would you like me to say?",
            "HELP_MESSAGE": "You can say things like talk smack or speak to any first name, about a category, or both. What would you like me to say?",
            "HELP_REPROMPT": "What would you like me to say ass hole?",
            "STOP_MESSAGE": "Later ass hole"
        }
    }
};

var LIST_OF_CATEGORIES = [
    "beer pong",
    "fantasy football",
    "love life",
    "yo mama"
];

var calculateRequestCount = function(application) {
    if (application) {
        return application.requestCount + 1 || 1;
    } else {
        return 1;
    }
};

var constructDynamoInsultsTableParams = function(category) {
    return {
        TableName : "Insults",
        Key: {
            category: category ? category.toLowerCase() : "default"
        }
    };
};

var constructSpeechOutput = function(name, insult) {
    if (name) {
        return "Hey " + name + ", " + insult;
    } else {
        return insult;
    }
};

var constructDynamoUpdateApplicationParams = function(opts) {
    return {
        Item: {
            category: opts.category,
            id: opts.userId,
            insult: opts.insult,
            name: opts.name,
            requestCount: opts.requestCount,
            updatedAt: opts.timestamp
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

var getInsultsFromDynamoByCategory = function(category) {
    var params = constructDynamoInsultsTableParams(category);
    var requestPromise = docClient.get(params).promise();
    return requestPromise.then(function(data) { return data });
};

var grabRandomInsult = function(insultsArr, lastItem) {
    var insultIndex = Math.floor(Math.random() * insultsArr.length);
    var randomInsult = insultsArr[insultIndex];
    if (insultsArr.length > 1 && lastItem && lastItem.insult === randomInsult) {
        return grabRandomInsult(insultsArr, lastItem);
    } else {
        return randomInsult;
    }
};

var grabRandomCategory = function() {
    var categoryIndex = Math.floor(Math.random() * LIST_OF_CATEGORIES.length);
    return LIST_OF_CATEGORIES[categoryIndex];
};

var updateApplication = function(opts) {
    var params = constructDynamoUpdateApplicationParams(opts);
    var requestPromise = docClient.put(params).promise();
    return requestPromise.then(function(data) { return data });
};

var determineInsult = async(function(opts) {
    var applicationResponse = await(getApplication(opts.userId));

    var insultsByCategoryResponse = await(getInsultsFromDynamoByCategory(opts.category));

    if (opts.category && !insultsByCategoryResponse.Item) {
        return "Sorry, we don't have a category called " + opts.category + ", try talking smack to someone about " + grabRandomCategory();
    }

    var randomInsult = grabRandomInsult(insultsByCategoryResponse.Item.insults, applicationResponse.Item);

    var updateOptions = {
        category: insultsByCategoryResponse.Item.category,
        insult: randomInsult,
        name: opts.name,
        requestCount: calculateRequestCount(applicationResponse.Item),
        timestamp: opts.timestamp,
        userId: opts.userId
    };

    await(updateApplication(updateOptions));

    return constructSpeechOutput(opts.name, randomInsult);
});

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
        var category = this.event.request.intent.slots.Category.value;
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
        var category = this.event.request.intent.slots.Category.value;
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

        if (item && item.category && item.insult) {
            var message = "From the " + item.category + " category. " + constructSpeechOutput(item.name, item.insult);
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

exports.handler = function(event, context, callback) {
    if (event.session.application.applicationId !== SMACK_TALKER_APP_ID) {
        throw new Error("Incorrect application ID");
    }

    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = SMACK_TALKER_APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = LANGUAGE_STRINGS;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

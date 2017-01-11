var waveformsLiveDictionary = (function() {

    var selectedLanguage = 'english';
    var supportedLanguages = [
        'english'/*,
        'french',
        'german',
        'japanese'*/
    ];
    var messages = {
        //General
        noChannelsActive: {
            english: 'No Channels Active. Please Activate a Channel and Run Again',
        },
        notImplemented: {
            english: 'Not Implemented'
        },
        timeout: {
            english: 'No Response Received'
        },
        selectOutput: {
            english: 'Click A Channel To Set It As An Output'
        },

        //Device
        deviceAdded: {
            english: 'Device Added Successfully'
        },
        deviceExists: {
            english: 'Device is Added Already'
        },
        noActiveDevice: {
            english: 'You currently have no device connected. Please visit the settings page.'
        },
        enumerateError: {
            english: 'Error: Invalid Device Enumeration'
        },
        invalidLevel: {
            english: 'Selected Level Value Is Not In Osc Input Voltage Range And May Not Trigger'
        },
        awgRunError: {
            english: 'The AWG May Have Been Running And Has Been Stopped. Please Try Again.'
        },
        awgParamError: {
            english: 'Could Not Set AWG Parameters. Please Try Again. If Problem Persists, Reset The Device'
        },
        dcInvalidSupply: {
            english: 'Invalid DC Supply Value'
        },

        //Agent
        agentExists: {
            english: 'Agent Is Added Already. Use Settings To Configure Current Active Device'
        },
        agentInvalidResponse: {
            english: 'Invalid Response From Agent'
        },
        agentEnumerateError: {
            english: 'No UART Devices Found'
        },
        agentConnectError: {
            english: 'Agent Could Not Connect To Device'
        },

        //Tutorial Tooltips
        tutorialAddADevice: {
            english: 'Click To Add A Device'
        },
        tutorialNetworkButton: {
            english: 'Click To Add A Network Device'
        },
        tutorialSimulatedButton: {
            english: 'Click To Add A Simulated Device'
        },
        tutorialAgentButton: {
            english: 'Click To Add An Agent'
        },
        tutorialAddCurrentDevice: {
            english: 'Click To Add Device'
        },
        tutorialBackToAddDevice: {
            english: 'Click To Select A Different Device Type'
        },
        tutorialDeviceCardMore: {
            english: 'Click To See More Options'
        },
        tutorialDeviceCard: {
            english: 'Click To Connect To Device And Navigate To Instrument Panel'
        },

        //Tooltips
        addADevice: {
            english: 'Add A Device'
        },
        networkButton: {
            english: 'Add A Network Device'
        },
        simulatedButton: {
            english: 'Add A Simulated Device'
        },
        agentButton: {
            english: 'Add An Agent'
        },
        addCurrentDevice: {
            english: 'Add Device'
        },
        backToAddDevice: {
            english: 'Select A Different Device Type'
        },
        deviceCardMore: {
            english: 'More'
        },
        deviceCard: {
            english: 'Connect To Device And Navigate To Instrument Panel'
        },
        cursorButton: {
            english: 'Open Cursor Menu'
        },
        mathButton: {
            english: 'Open Math Menu'
        },
        refreshMathButton: {
            english: 'Refresh Math'
        },
        directionButton: {
            english: 'Change GPIO Directions'
        },
        refreshGpioButton: {
            english: 'Read GPIO Inputs'
        },
        analyzerButton: {
            english: 'Select Analyzer Channels'
        },
        chartSettings: {
            english: 'Export Chart'
        },
        chartAutoscale: {
            english: 'Autoscale Chart'
        },
        chartShowDevicePinout: {
            english: 'Show Device Pinout'
        }
    };
    var statusCodes = {
        error: 1,
        ok: 0
    };

    /**************************************************
    * Private Function Definitions 
    **************************************************/
    var getStatusCode = function getStatusCode(error) {
        if (error) {
            return statusCodes['error'];
        }
        return statusCodes['ok'];
    }

    /**************************************************
    * Public Function Definitions
    **************************************************/
    var getMessage = function getMessage(key) {
        var returnObject = {};

        var messageObject = messages[key];
        if (messageObject == undefined) {
            returnObject.message = 'Unrecognized Key';
            returnObject.statusCode = getStatusCode(true);
            return returnObject;
        }

        var message = messageObject[selectedLanguage];
        if (message == undefined) {
            returnObject.message = 'No Translation Available For Selected Key';
            returnObject.statusCode = getStatusCode(true);
            return returnObject;
        }
        returnObject.message = message;
        returnObject.statusCode = getStatusCode(false);
        return returnObject;
    }

    var setLanguage = function setLanguage(newLanguage) {
        var returnObject = {};
        if (supportedLanguages.indexOf(newLanguage) === -1) {
            //Unsupported Language
            returnObject.message = 'Unsupported Language';
            returnObject.statusCode = getStatusCode(true);
            return returnObject;
        }
        selectedLanguage = newLanguage;
        returnObject.message = 'Success';
        returnObject.statusCode = getStatusCode(false);
        return returnObject;
    }

    var getMessageKeyValues = function getMessageKeyValues() {
        return messages;
    }

    var getSupportedLanguages = function getSupportedLanguages() {
        return supportedLanguages;
    }
    
    /**************************************************
    * Return Functions
    **************************************************/
    return {
        getMessage: getMessage,
        setLanguage: setLanguage,
        getMessageKeyValues: getMessageKeyValues,
        getSupportedLanguages: getSupportedLanguages
    }
})()
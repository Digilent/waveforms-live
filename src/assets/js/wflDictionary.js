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
            english: 'Not Currently Implemented'
        },
        timeout: {
            english: 'No Response Received'
        },
        selectOutput: {
            english: 'Click A Channel To Set It As An Output'
        },

        //Device
        //Appears when a device is added successfully on the device manager page.
        deviceAdded: {
            english: 'Device Added Successfully'
        },
        //Appears when a user tries to add a device that already exists.
        deviceExists: {
            english: 'Device is Added Already'
        },
        //Appears when a user navigates to the instrument panel without an active device (shouldn't happen).
        noActiveDevice: {
            english: 'You currently have no device connected. Please visit the settings page.'
        },
        //Appears when an enumeration response from a device is invalid.
        enumerateError: {
            english: 'Error: Invalid Device Enumeration'
        },
        //Appears when a trigger level value is invalid.
        invalidLevel: {
            english: 'Selected Level Value Is Not In Osc Input Voltage Range And May Not Trigger'
        },
        //Appears when an AWG run command returns a statusCode error.
        awgRunError: {
            english: 'The AWG May Have Been Running And Has Been Stopped. Please Try Again.'
        },
        //Appears when an AWG set parameters command returns a statusCode error.
        awgParamError: {
            english: 'Could Not Set AWG Parameters. Please Try Again. If Problem Persists, Reset The Device'
        },
        //Appears when a user enters an invalid DC Supply value.
        dcInvalidSupply: {
            english: 'Invalid DC Supply Value'
        },
        //Appears when a trigger stop fails
        triggerStopError: {
            english: 'Error Stopping Trigger. If This Problem Continues, Restart The Device And WaveForms Live'
        },
        triggerForceError: {
            english: 'Error Forcing Trigger. This Is Most Likely Due To An Unarmed Trigger'
        },
        triggerForceNotArmed: {
            english: 'The Device Is Still Arming The Trigger. Please Try Again'
        },

        //Agent
        //Appears when a user tries to add an agent that already exists.
        agentExists: {
            english: 'Agent Is Added Already. Use Settings To Configure Current Active Device'
        },
        //Appears when an agent responds with invalid JSON (should not appear)
        agentInvalidResponse: {
            english: 'Invalid Response From Agent'
        },
        //Appears when the agent enumerates and does not find any devices.
        agentEnumerateError: {
            english: 'No UART Devices Found'
        },
        //Appears when the user tries to add an agent and no response is found.
        agentConnectError: {
            english: 'Agent Could Not Connect To Device'
        },

        //Tutorial Tooltips
        //Appears on main add a device button on device-manager-page
        tutorialAddADevice: {
            english: 'Click To Add A Device'
        },
        //Appears on the network device button when adding a new device.
        tutorialNetworkButton: {
            english: 'This Button Adds A Device That Is On Your WiFi Network'
        },
        //Appears on the simulated device button when adding a new device.
        tutorialSimulatedButton: {
            english: 'Click To Add A Simulated Device'
        },
        //Appears on the agent button when adding a new device.
        tutorialAgentButton: {
            english: 'This Button Adds An Agent Which Allows You To Talk To USB Devices'
        },
        //Appears on the button used to attempt to add the current device.
        tutorialAddCurrentDevice: {
            english: 'Click To Add Device'
        },
        //Appears on the button used to navigate backwards to the device type selection stage.
        tutorialBackToAddDevice: {
            english: 'Click To Select A Different Device Type'
        },
        //Appears on the 'more' button on a device card.
        tutorialDeviceCardMore: {
            english: 'Click To See More Options'
        },
        //Appears on the device card.
        tutorialDeviceCard: {
            english: 'Click To Connect To Device And Navigate To Instrument Panel'
        },
        tutorialWaveSelectButton: {
            english: 'Use These Buttons To Select A Wave Type'
        },
        tutorialFgenPower: {
            english: 'Click To Toggle Wavegen Power'
        },
        tutorialTriangleButton: {
            english: 'Select A Triangle Wave'
        },
        tutorialTimeline: {
            english: 'This Is The Timeline. It Shows Your Window In The Current Buffer. Click And Drag To Pan And Mousewheel To Zoom.'
        },
        tutorialChart: {
            english: 'This Is The Chart. Click And Drag To Pan And Mousewheel To Zoom.'
        },
        tutorialLoopBack: {
            english: 'For The Simulated Device, The AWG Is Connected To The Oscilloscope.'
        },
        tutorialSingleButton: {
            english: 'Click To Get A Buffer Of Data.'
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
        gpioButton: {
            english: 'Select GPIO Channels'
        },
        chartSettings: {
            english: 'Export Chart'
        },
        chartAutoscale: {
            english: 'Autoscale Chart'
        },
        chartShowDevicePinout: {
            english: 'Show Device Pinout'
        },
        chartCenterOnTrigger: {
            english: 'Center View On Trigger'
        },
        chartToggleFft: {
            english: 'Toggle FFT View'
        },
        sineButton: {
            english: 'Sine Wave'
        },
        triangleButton: {
            english: 'Triangle Wave'
        },
        sawtoothButton: {
            english: 'Sawtooth Wave'
        },
        squareButton: {
            english: 'Square Wave'
        },
        fgenPower: {
            english: 'Toggle Wavegen Power'
        },
        dcButton: {
            english: 'DC'
        },
        triggerLevel: {
            english: 'Trigger Level'
        },
        triggerSource: {
            english: 'Trigger Source'
        },
        triggerRisingEdge: {
            english: 'Rising Edge Trigger'
        },
        triggerFallingEdge: {
            english: 'Falling Edge Trigger'
        },
        triggerOff: {
            english: 'No Trigger?'
        },
        triggerForce: {
            english: 'Force Trigger'
        },
        configDeviceRetryEnumerate: {
            english: 'Retry Enumeration'
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
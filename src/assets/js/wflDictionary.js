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
        upgradeFirmware: {
            english: 'This Feature Requires A Newer Firmware Version'
        },

        //Device
        //Appears when a device is added successfully on the device manager page.
        deviceAdded: {
            english: 'Device Added Successfully'
        },
        deviceUnknown: {
            english: 'Device Model Unknown'
        },
        //Appears when a user tries to add a device that already exists.
        deviceExists: {
            english: 'Device Is Added Already'
        },
        deviceResetError: {
            english: 'Unable To Reset Device'
        },
        deviceDroppedConnection: {
            english: 'No Response From Device'
        },
        deviceOutdatedFirmware: {
            english: 'Please Use The Digilent Agent To Update Firmware'
        },
        deviceResetCalibrationError: {
            english: 'Unable To Reset Device. Make Sure The Device Is Still Connected And Is On The Latest Firmware'
        },
        //Appears when a user navigates to the instrument panel without an active device (shouldn't happen).
        noActiveDevice: {
            english: 'You Currently Have No Device Connected. Please Visit The Device Manager Page.'
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
        awgOnNoLa: {
            english: 'Cannot Enable The Logic Analyzer Because The Wavegen Is Running'
        },
        laOnNoAwg: {
            english: 'Cannot Turn On The Wavegen Because The LA Is Running'
        },
        oscSetParamError: {
            english: 'Error Setting Oscilloscope Parameters. Please Try Again'
        },
        genericSingleError: {
            english: 'Error Starting Acquisition. Please Try Again'
        },
        bodeInvalidRange: {
            english: 'Error Starting. Invalid Frequency Range'
        },
        bodeAborted: {
            english: 'Bode Plot Aborted'
        },
        bodeCalibrate: {
            english: 'Calibrate'
        },

        //Agent
        //Appears when a user tries to add an agent that already exists.
        agentExists: {
            english: 'Agent Already Added. Click The More Button On The Agent Card And Select Configure To Change The Active Device'
        },
        //Appears when an agent responds with invalid JSON (should not appear)
        agentInvalidResponse: {
            english: 'Invalid Response From Agent'
        },
        agentNoResponse: {
            english: 'Error Connecting To The Digilent Agent. Please Make Sure the Digilent Agent Is Running'
        },
        //Appears when the agent enumerates and does not find any devices.
        agentEnumerateError: {
            english: 'No UART Devices Found'
        },
        //Appears when the user tries to add an agent and no response is found.
        agentConnectError: {
            english: 'Agent Could Not Connect To Device'
        },
        agentEnterJsonError: {
            english: 'Unable To Communicate With Device'
        },
        agentNoActiveDevice: {
            english: 'The Digilent Agent Has No Active Device. Please Go Back To Device Manager Page And Select A Device'
        },

        //Tutorial Tooltips
        //Appears on main add a device button on device-manager-page
        tutorialAddADevice: {
            english: 'Click To Add A New Device'
        },
        //Appears on the network device button when adding a new device.
        tutorialNetworkButton: {
            english: 'This Button Adds A Device That Is On The Network'
        },
        //Appears on the simulated device button when adding a new device.
        tutorialSimulatedButton: {
            english: 'Click To Add A Simulated Device'
        },
        //Appears on the agent button when adding a new device.
        tutorialAgentButton: {
            english: 'This Button Adds The Digilent Agent Which Enables Communication With USB Devices'
        },
        //Appears on the button used to attempt to add the current device.
        tutorialAddCurrentDevice: {
            english: 'Click To Add The Device'
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
            english: 'The Device Has Been Saved To The Device Manager. Click To Connect To The Device And Navigate To The Instrument Panel'
        },
        tutorialWaveSelectButton: {
            english: 'These Buttons Set The Wave Type'
        },
        tutorialFgenPower: {
            english: 'Click To Turn The Wavegen On'
        },
        tutorialTriangleButton: {
            english: 'Click The Triangle Wave Button'
        },
        tutorialTimeline: {
            english: 'This Is The Timeline. It Shows The View In The Current Buffer. Click And Drag To Pan. Mousewheel To Zoom.'
        },
        tutorialChart: {
            english: 'This Is The Chart. Click And Drag To Pan. Mousewheel To Zoom.'
        },
        tutorialLoopBack: {
            english: 'The Simulated Device Wavegen Is Connected To The Oscilloscope'
        },
        tutorialSingleButton: {
            english: 'Click To Arm The Trigger. Data Is Returned When The Acquisition Is Complete'
        },
        tutorialTriggerType: {
            english: 'These Buttons Set The Trigger Type'
        },
        tutorialTriggerLevel: {
            english: 'This Sets The Trigger Level'
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
        chartToBode: {
            english: 'To Bode Page'
        },
        chartResetDevice: {
            english: 'Reset Device And ReInitialize'
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
            english: 'Auto Force'
        },
        triggerForce: {
            english: 'Force Trigger'
        },
        triggerSource: {
            english: 'Set The Trigger Source'
        },
        triggerLevel: {
            english: 'Set The Trigger Level'
        },
        oscOffset: {
            english: 'Set Offset'
        },
        oscVpd: {
            english: 'Set Volts / Division'
        },
        oscSamplingFreq: {
            english: 'Osc Sampling Frequency'
        },
        oscSampleSize: {
            english: 'Osc Sample Size'
        },
        xAxisTpd: {
            english: 'Set Time / Division'
        },
        awgFreq: {
            english: 'Set Wavegen Frequency'
        }, 
        awgAmp: {
            english: 'Set Wavegen Amplitude'
        }, 
        awgOffset: {
            english: 'Set Wavegen Offset'
        },
        dcVoltage: {
            english: 'Set DC Voltage'
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
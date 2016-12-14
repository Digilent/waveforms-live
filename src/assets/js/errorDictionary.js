var waveformsLiveErrorDictionary = (function() {

    var errors = {
        "1": 'Error: 1'
    };

    /**************************************************
    * Function Definitions
    **************************************************/
    var getErrorMessage = function getErrorMessage(errorNumber) {
        var errorMessage = errors[errorNumber];
        if (errorMessage == undefined) {
            errorMessage = 'Unrecognized Error Code';
        }
        return errorMessage;
    }
    
    /**************************************************
    * Return Functions
    **************************************************/
    return {
        getErrorMessage: getErrorMessage
    }
})()
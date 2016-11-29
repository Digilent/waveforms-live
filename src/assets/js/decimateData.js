// datamanager.js
// ////////////////////////////////////////////////////////////

// this file contains the definition for the data manager that can be used with our XSpice simulator

var decimateModule = (function () {
    'use strict';

    var CONSTANTS = Object.freeze(
        {
            InitialArraySize: 2000,
        });

    var EDataUpdateEvents = Object.freeze({
        AddData: 'addData',
        Initialized: 'initialize',
        Stale: 'dataStale',
        Refreshed: 'dataRefreshed',
    });

    function calcIntersectPoint(lastX, lastY, x, y, target) { return lastX + ((target - lastY) * ((x - lastX) / (y - lastY))); }

    var MeasurementUtils = {
        update: function (measurements, limits, x, traceData, length) {
            var xdelta;

            // update the crossing value the mean since the last 'signal reaquisition'
            if (measurements.crossingValueDivisor === 0) {
                measurements.crossingValueInProgress = traceData[length - 1];
                measurements.crossingValueDivisor = 1;
            } else {
                measurements.crossingValueInProgress = (measurements.crossingValueInProgress * 0.9) + (0.1 * traceData[length - 1]);

                // update for mean crossing
                if (!measurements.crossedAfterPeak) {
                    var crossingValue = measurements.crossingValueInProgress / measurements.crossingValueDivisor;

                    if ((measurements.isLastPeakHigh && traceData[length - 1] < crossingValue) || (!measurements.isLastPeakHigh && traceData[length - 1] > crossingValue)) {
                        // ok we just crossed the value
                        measurements.crossedAfterPeak = true;
                    }
                    // alternate case, crossing the last periods mean also counts
                    else if (!isNaN(measurements.mean) && ((measurements.isLastPeakHigh && traceData[length - 1] < measurements.mean) || (!measurements.isLastPeakHigh && traceData[length - 1] > measurements.mean))) {
                        // ok we just crossed the mean
                        measurements.crossedAfterPeak = true;
                    }
                }
            }

            // update the peak to peak stuff... first we need to see if we are at a peak
            if (length >= 2) {
                var deltaY = traceData[length - 1] - traceData[length - 2];
                if (deltaY > 0) {
                    if (measurements.lastDeltaY < 0) {
                        // we require a center crossing in between our low and high peaks... otherwise it just doesn't count as a peak
                        if ((measurements.crossedAfterPeak || isNaN(measurements.peak.highPeriod)) && measurements.isLastPeakHigh) {
                            // ok we have a change in direction, this is a local minima.
                            if (!isNaN(measurements.peak.lowTime)) {
                                // before we update the low peak time to the newest time we measure and record the period
                                measurements.peak.lowPeriod = measurements.lastX - measurements.peak.lowTime;
                            }

                            measurements.peak.lowTime = measurements.lastX; // the actual peak point was at the last point, not this one since we have started to move away from it again!
                            measurements.peak.low = traceData[length - 2];
                            measurements.isLastPeakHigh = false;
                            measurements.crossedAfterPeak = false;
                        } else {
                            // ignore this peak... it doesn't count!
                        }
                    }

                    measurements.lastDeltaY = deltaY;
                } else if (deltaY < 0) {
                    if (measurements.lastDeltaY > 0) {
                        // we require a center crossing in between our low and high peaks... otherwise it just doesn't count as a peak
                        if ((measurements.crossedAfterPeak || isNaN(measurements.peak.lowPeriod)) && !measurements.isLastPeakHigh) {
                            if (!isNaN(measurements.peak.highTime)) {
                                // before we update the low peak time to the newest time we measure and record the period
                                measurements.peak.highPeriod = measurements.lastX - measurements.peak.highTime;

                                // clear the mean at each high-peak
                                if (measurements.meanDivisor > 0) {
                                    measurements.mean = measurements.meanInProgress / measurements.meanDivisor;
                                } else {
                                    measurements.mean = NaN;
                                }
                                measurements.meanDivisor = 0;
                                measurements.meanInProgress = 0;

                                // clear the RMS at each high-peak
                                measurements.rms = Math.sqrt(measurements.rmsRunningTotal / measurements.rmsDivisor);
                                measurements.rmsRunningTotal = 0;
                                measurements.rmsDivisor = 0;
                            }

                            // ok we have a change in direction, this is a local minima.
                            measurements.peak.highTime = measurements.lastX; // the actual peak point was at the last point, not this one since we have started to move away from it again!
                            measurements.peak.high = traceData[length - 2];
                            measurements.isLastPeakHigh = true;
                            measurements.crossedAfterPeak = false;
                        } else {
                            // ignore this peak... it doesn't count!
                        }
                    }

                    measurements.lastDeltaY = deltaY;
                }
                // else if (deltaY === 0)
                // {
                //    special case, if we have a flat spot then do nothing... don't update the lastDeltaY becucase then a sqeuence like +1, 0, +1 might trigger when it shouldn't, or conversely +1, 0, -1 might NOT trigger
                // }

                // update the means
                if (isNaN(measurements.meanInProgress)) {
                    xdelta = x - measurements.lastX;
                    measurements.meanInProgress += xdelta * traceData[length - 1];
                    measurements.meanDivisor += xdelta;
                } else {
                    xdelta = x - measurements.lastX;
                    var newArea = (xdelta * traceData[length - 2]) + (((traceData[length - 1] - traceData[length - 2]) / 2.0) * xdelta);
                    measurements.meanInProgress += newArea;
                    measurements.meanDivisor += xdelta;
                }

                if (!isNaN(traceData[length - 1])) {
                    var deltaX = x - measurements.lastX;
                    var area = traceData[length - 1] * deltaX; // rectangular aproximation
                    // var area = ((y - _lastY) / 2.0f + _lastY) * deltaX; //trapizodal aproximation.. for techincally accurate for the data points but sadly gives poor results for the default AC Power simulation.
                    measurements.rmsRunningTotal += area * area / deltaX;
                    measurements.rmsDivisor += deltaX;
                }
            }

            // watch for the need to reset things... because of the mean-crossing requirement it is possible for a sudden change in signal (specifically a sudden jump in the DC offset) to cause peaks to fail to register.
            // if we don't do something then the data will become 'stuck' never updating as it never hits a new period.  So our rule is if we go for 3 times the previous period without hitting anything then we just reset
            // our last period mean so that the whole process will start over.
            if ((!isNaN(measurements.peak.highTime) && !isNaN(measurements.peak.highPeriod)) || (!isNaN(measurements.peak.lowTime) && !isNaN(measurements.peak.lowPeriod))) {
                xdelta = Math.min(measurements.lastX - measurements.peak.highTime, measurements.lastX - measurements.peak.lowTime);
                var period = 0.0;

                if (!isNaN(measurements.peak.highPeriod) && !isNaN(measurements.peak.lowPeriod)) {
                    period = Math.max(measurements.peak.lowPeriod, measurements.peak.highPeriod);
                } else if (!isNaN(measurements.peak.highPeriod)) {
                    period = measurements.peak.highPeriod;
                } else {
                    period = measurements.peak.lowPeriod;
                }

                if (xdelta > 5 * period) {
                    // reset everything
                    measurements.crossingValueInProgress = 0;
                    measurements.crossingValueDivisor = 0;
                    measurements.peak.highPeriod = NaN;
                    measurements.peak.lowPeriod = NaN;
                    measurements.peak.highTime = NaN;
                    measurements.peak.high = NaN;
                    measurements.peak.lowTime = NaN;
                    measurements.peak.low = NaN;//* /
                    measurements.rms = 0;
                    measurements.rmsDivisor = 0;
                    measurements.rmsRunningTotal = 0;
                    measurements.meanInProgress = 0;
                    measurements.meanDivisor = 0;
                    measurements.mean = NaN;
                    // _lastMeanCrossingTime = double.NaN;
                    measurements.crossedAfterPeak = false;
                }
            }

            measurements.lastX = x;
        },
    };
    var EDataUpdateEvents = EDataUpdateEvents;
    var dataUpdateListeners = dataUpdateListeners;
    var DoubleArrays = [],		// /< Keep a separate array for each data channel
        DataSize = 0,				// /< Number of items per array
        DecimationTarget = 2000,	// /< used to determine decimation requirements, set this to the pixel width of the canvas
        Limits =
            {
                minx: NaN,			// minimum X value
                maxx: NaN,			// Maximum X value
                miny: NaN,			// Minimum Y value over all series
                maxy: NaN,			// Maximum Y value over all series
                serieslimits: [],	// Per series minimum Y value
            },						// /< The limits for the data values in the data manager
        Names = [],				// /< names for each of the arrays
        decimatedCache = null;	// /< cache for decimate data
    var stale = false;

    function setStale(newState) {
        // Data can't be stale if there is no data
        newState = DataSize > 0 ? newState : false;
        stale = newState;

        if (dataUpdateListeners) {
            dataUpdateListeners.notifyListeners(newState === false ? EDataUpdateEvents.Refreshed : EDataUpdateEvents.Stale);
        }
    }

    function resetDecimationCache() {
        decimatedCache = {
            dataSlice: null,	// data
            min: -1,			// min value represented in the data on time of decimation
            max: -1,			// max value represented in the data on time of decimation
            decimationTarget: 0, // number of pixel points to decimate to
            transform: null,		// transform function used in the decimation
            compressionResolution: 0,
            compressionBufferIndex: -1,
            compressionBufferTraceExtremes: null,
            fullyDecimatedSliceIndex: -1,	// the index until which the slice is fully decimated, the data after this index is should be thrown out and re-decimated if new data is appended
        };
    }

    resetDecimationCache();

    var Measurements = [];

    // Helper function to reset a buffer with an array for each trace
    function resetBufferForTraces() {
        console.log(Names);
        var newBuffer = Names.map(function () { return []; });
        newBuffer.pop(); // we do not output the data for trace 0 which is time/frequency

        return newBuffer;
    }

    function resetTraceExtremesStartingAtIndex(index, p_Data) {
        var newBuffer = resetBufferForTraces();

        newBuffer.forEach(function (traceBuffer, traceBufferIndex) {
            console.log('for each');
            // 2 extremes, so start with 2 points
            traceBuffer.push([p_Data[0][index], p_Data[traceBufferIndex + 1][index]]);
            traceBuffer.push([p_Data[0][index], p_Data[traceBufferIndex + 1][index]]);
        });

        return newBuffer;
    }

    function copySingleTraceDataToDecimationBuffer(nameIndex, dataIndex, p_Data, decimatedData) {
        decimatedData[nameIndex - 1].push([p_Data[0][dataIndex], p_Data[nameIndex][dataIndex]]);
    }

    function copyAllTracesToDecmiationBuffer(dataIndex, p_Data, decimatedData) {
        for (var nameIndex = 1; nameIndex < Names.length; ++nameIndex) {
            copySingleTraceDataToDecimationBuffer(nameIndex, dataIndex, p_Data, decimatedData);
        }
    }

    function updateCompressionBufferExtremes(dataIndex, p_Data, compressionBufferTraceExtremes) {
        for (var nameIndex = 1; nameIndex < Names.length; ++nameIndex) {
            var traceY = p_Data[nameIndex][dataIndex];
            var orderedExtremes = compressionBufferTraceExtremes[nameIndex - 1];

            var minIndex = orderedExtremes[0][1] < orderedExtremes[1][1] ? 0 : 1;
            var maxIndex = orderedExtremes[0][1] > orderedExtremes[1][1] ? 0 : 1;
            var isMin = traceY < orderedExtremes[minIndex][1];
            var isMax = traceY > orderedExtremes[maxIndex][1];

            var indexToReplace = isMax ? maxIndex : isMin ? minIndex : null;

            if (indexToReplace !== null) {
                if (indexToReplace === 0) {
                    // Shift the points over
                    orderedExtremes[0] = orderedExtremes[1];
                }

                // Add new point at the end
                orderedExtremes[1] = [p_Data[0][dataIndex], p_Data[nameIndex][dataIndex]];
            }
        }
    }

    // Helper function to append the compression buffer extremes to the decimation buffer
    function copyCompressionBufferExtremesToDecimationBuffer(compressionBufferTraceExtremes, decimatedData) {
        compressionBufferTraceExtremes.forEach(function (traceExtremes, traceBufferIndex) {
            traceExtremes.forEach(function (traceExtreme) {
                decimatedData[traceBufferIndex].push(traceExtreme);
            });
        });
    }

    function defaultTransform(v) { return v; }

    // / get a decimated version back of the given data
    // / @param p_Data : Array containing the data that will be decimated, this array is not changed
    // / @param startIndex : Number of the first index to decimate from.
    // / @param endIndex: Number of the last index to decimate to
    // / @param resolution : The number of "pixels" we are targeting for
    // / @param transform : Optional custom transformation function
    // / @return an array containing decimated data
    function decimate(p_Data, startIndex, endIndex, resolution, transform) {
        console.log('in decimate function');
        var emptyCache = !decimatedCache.dataSlice;
        // Don't go over the end of the data
        endIndex = Math.min(endIndex, DataSize - 1);

        if (emptyCache) {
            // This is the output buffer. Top level array is one item for each trace not counting trace0 which is time / frequency
            // Each top level item points to an array of points.
            // Each point is an array with 2 items. The first is the x value and the second is the y value.
            decimatedCache.dataSlice = resetBufferForTraces();

            // What is the range of data we want to display in transformed coordinates?
            // We are allowed to do this because after the log, our frequency data is nicely linear
            var dataRange = transform(decimatedCache.max - decimatedCache.min);

            // A measure of how many points collapse to a single pixel on the graph given the resolution
            // points need to be this far apart to not require decimation
            decimatedCache.compressionResolution = (dataRange) / (resolution / 2);

            // The index in the data where the compression buffer starts
            decimatedCache.compressionBufferIndex = startIndex;
        }
        else {
            // remove the items that were not fully decimated
            // we will be starting just after the last fully decimated values
            decimatedCache.dataSlice.forEach(function (p_Slice) {
                p_Slice.splice(decimatedCache.fullyDecimatedSliceIndex, p_Slice.length);
            });
        }

        // A buffer to trace the trace extremes (ordered by x value) for each trace
        console.log(p_Data);
        decimatedCache.compressionBufferTraceExtremes = resetTraceExtremesStartingAtIndex(decimatedCache.compressionBufferIndex, p_Data);
        console.log(decimatedCache.compressionBufferTraceExtremes);

        for (var dataIndex = decimatedCache.compressionBufferIndex; dataIndex <= endIndex; ++dataIndex) {
            var compressionBufferResolution = transform(p_Data[0][dataIndex]) - transform(p_Data[0][decimatedCache.compressionBufferIndex]);

            if (compressionBufferResolution >= decimatedCache.compressionResolution) {
                // We need to flush out data for and reset the compressionBuffer

                if (dataIndex - decimatedCache.compressionBufferIndex >= 4) {
                    // Push the start point onto the decimation buffer
                    copyAllTracesToDecmiationBuffer(decimatedCache.compressionBufferIndex, p_Data, decimatedCache.dataSlice);

                    // Push extremes onto the decimation buffer
                    copyCompressionBufferExtremesToDecimationBuffer(decimatedCache.compressionBufferTraceExtremes, decimatedCache.dataSlice);

                    // Push the end point onto the decimation buffer
                    copyAllTracesToDecmiationBuffer(dataIndex - 1, p_Data, decimatedCache.dataSlice);
                } else {
                    // Do not decimate as there are not enough points.
                    for (var copyIndex = decimatedCache.compressionBufferIndex; copyIndex < dataIndex; ++copyIndex) {
                        copyAllTracesToDecmiationBuffer(copyIndex, p_Data, decimatedCache.dataSlice);
                    }
                }

                // Reset the compression buffer
                decimatedCache.compressionBufferIndex = dataIndex;
                decimatedCache.compressionBufferTraceExtremes = resetTraceExtremesStartingAtIndex(dataIndex, p_Data);
                decimatedCache.fullyDecimatedSliceIndex = decimatedCache.dataSlice[0].length;
            } else {
                // Update maximum and minimums
                updateCompressionBufferExtremes(dataIndex, p_Data, decimatedCache.compressionBufferTraceExtremes);
            }
        }

        // After the loop has finished, we need to do one final flush to the decimation buffer
        if (endIndex - decimatedCache.compressionBufferIndex >= 4) {
            // decimate
            copyAllTracesToDecmiationBuffer(decimatedCache.compressionBufferIndex, p_Data, decimatedCache.dataSlice);
            copyCompressionBufferExtremesToDecimationBuffer(decimatedCache.compressionBufferTraceExtremes, decimatedCache.dataSlice);
            copyAllTracesToDecmiationBuffer(endIndex, p_Data, decimatedCache.dataSlice);
        } else {
            for (; decimatedCache.compressionBufferIndex < endIndex; ++decimatedCache.compressionBufferIndex) {
                copyAllTracesToDecmiationBuffer(decimatedCache.compressionBufferIndex, p_Data, decimatedCache.dataSlice);
            }
        }

        return decimatedCache.dataSlice;
    }

    var mapDisplayNameToSignal = new Map();

    // return the public interface for a data manager object
    return {
        EDataUpdateEvents: EDataUpdateEvents,
        dataUpdateListeners: dataUpdateListeners,

        // initialize the data series information
        // This will clear the current data and limits
        // @param p_Names : The names for each item in the data array
        initData: function initData(p_Names) {
            setStale(false);
            resetDecimationCache();
            Names = p_Names.slice(); // assign the new names
            DataSize = 0; // reset the data size
            DoubleArrays = []; // clear the data
            Measurements = []; // clear the measurements
            Limits =   // initialize the limits to the default values
                {
                    minx: NaN,			// minimum X value
                    maxx: NaN,			// Maximum X value
                    miny: NaN,			// Minimum Y value over all series
                    maxy: NaN,			// Maximum Y value over all series
                    serieslimits: [],	// Per series minimum Y value
                };

            // create the initial arrays
            Names.forEach(function () {
                DoubleArrays.push(new Float64Array(CONSTANTS.InitialArraySize));
            });

            // local scope
            (function () {
                // initialize the per series limits
                for (var Index = 1; Index < p_Names.length; Index++) {
                    Limits.serieslimits.push({ miny: NaN, maxy: NaN });
                }
            })();

            p_Names.forEach(function () {
                Measurements.push({
                    mean: NaN,
                    peak: { high: NaN, low: NaN, highPeriod: NaN, lowPeriod: NaN, highTime: NaN, lowTime: NaN },
                    rms: NaN,
                    crossingValueDivisor: 0,
                    crossingValueInProgress: 0,
                    crossedAfterPeak: false,
                    isLastPeakHigh: false,
                    meanDivisor: 0,
                    lastX: 0,
                    lastDeltaY: 0,
                    meanInProgress: 0,
                    rmsRunningTotal: 0,
                    rmsDivisor: 0,
                });
            });

            if (dataUpdateListeners) {
                dataUpdateListeners.notifyListeners(EDataUpdateEvents.Initialized);
            }
        },
        // appends new data and calculates the limits
        // @param p_Data : array of data sets where each set consists of an x value followed by the y values (e.g. [[xvalue1, y1, y2, ...,yn-1,yn], [xvalue2, y1, y2, ...,yn-1,yn], ...] )
        // @param p_DataTransformer : Optional function to transform the data
        appendData: function appendData(p_Data, p_DataTransformer, p_ActiveAnalysis) {
            console.log(p_Data);
            var firstData = DataSize === 0;

            p_Data.forEach(function (p_Element) {
                var Index = 0,
                    AnalogData = p_Element.filter(function (p_Value) { return typeof p_Value !== 'object'; }),
                    // DigitalData = p_Element.filter(function(p_Value){ return typeof p_Value === "object"; }),
                    NewData = (p_DataTransformer) ? p_DataTransformer(AnalogData) : AnalogData;

                if (DataSize === 0) {
                    // x values are assumed to be in ascending order so we can just use the first x
                    Limits.minx = p_Data[0][0];
                }

                // go through the data to get the per series and the total y limits
                for (Index = 1; Index < NewData.length; Index++) {
                    if (DataSize === 0 && Index === 1) {
                        Limits.miny = NewData[Index];
                        Limits.maxy = NewData[Index];
                    }
                    else {
                        Limits.miny = Math.min(Limits.miny, NewData[Index]);
                        Limits.maxy = Math.max(Limits.maxy, NewData[Index]);
                    }

                    if (DataSize === 0) {
                        Limits.serieslimits[Index - 1].miny = NewData[Index];
                        Limits.serieslimits[Index - 1].maxy = NewData[Index];
                    }
                    else {
                        Limits.serieslimits[Index - 1].miny = Math.min(Limits.serieslimits[Index - 1].miny, NewData[Index]);
                        Limits.serieslimits[Index - 1].maxy = Math.max(Limits.serieslimits[Index - 1].maxy, NewData[Index]);
                    }
                }

                if (DataSize === DoubleArrays[0].length) {
                    // double the size
                    var TempArray = [];

                    DoubleArrays.forEach(function (p_DoubleElement, p_Index) {
                        TempArray.push(new Float64Array(Math.min(p_DoubleElement.length * 2, p_DoubleElement.length + 1000000)));
                        TempArray[p_Index].set(p_DoubleElement);
                    });

                    DoubleArrays = TempArray;
                }

                // copy the new data items into our data buffers
                DoubleArrays.forEach(function (p_DoubleElement, p_Index, p_ThisArray) {
                    p_ThisArray[p_Index][DataSize] = this[p_Index];
                }, NewData);
                DataSize++;

                Limits.maxx = p_Data[p_Data.length - 1][0];

                DoubleArrays.forEach(function (p_DataArray, index) {
                    MeasurementUtils.update(Measurements[index], Limits.serieslimits[index], p_Element[0], p_DataArray, DataSize);
                });
            });

            if (dataUpdateListeners) {
                dataUpdateListeners.notifyListeners(EDataUpdateEvents.AddData, { firstData: firstData, activeAnalysis: p_ActiveAnalysis });
            }
        },
        getTriggerPoint: function (p_StartX, p_OnRising, p_OnFalling, p_Value, p_Signal) {
            var triggerPoint = null;
            // first get the right signal
            var signalIndex = Names.indexOf(p_Signal);

            if (signalIndex != -1) {
                // find the first point that crosses the given value starting from the given start point x
                var firstIndex = Math.max(0, DoubleArrays[0].upper_bound(function (p_Element) {
                    return p_StartX < p_Element;
                }, DataSize) - 1);
                var lastIndex = Math.min(DataSize, DoubleArrays[signalIndex].length);

                if (p_Value === null) {
                    p_Value = Measurements[signalIndex].mean;
                }

                // if we have not a number, we cannot calculate the mean, so we will trigger just on any change
                if (isNaN(p_Value)) {
                    // put these in separate for loops for performance (less tests to perform within the for loops themselves)
                    if (p_OnRising && !p_OnFalling) {
                        // from the first index find the first change in the right direction
                        for (var risingChangeIndex = firstIndex + 1; risingChangeIndex < lastIndex; risingChangeIndex++) {
                            if (DoubleArrays[signalIndex][risingChangeIndex - 1] < DoubleArrays[signalIndex][risingChangeIndex]) {
                                triggerPoint = DoubleArrays[0][risingChangeIndex - 1];
                                break;
                            }
                        }
                    }
                    else if (p_OnFalling && !p_OnRising) {
                        // from the first index find the first change in the right direction
                        for (var fallingChangeIndex = firstIndex + 1; fallingChangeIndex < lastIndex; fallingChangeIndex++) {
                            if (DoubleArrays[signalIndex][fallingChangeIndex - 1] > DoubleArrays[signalIndex][fallingChangeIndex]) {
                                triggerPoint = DoubleArrays[0][fallingChangeIndex - 1];
                                break;
                            }
                        }
                    }
                    else { // either
                        // from the first index find the first place where values are not equal
                        for (var changeIndex = firstIndex + 1; changeIndex < lastIndex; changeIndex++) {
                            if (DoubleArrays[signalIndex][changeIndex - 1] != DoubleArrays[signalIndex][changeIndex]) {
                                triggerPoint = DoubleArrays[0][changeIndex - 1];
                                break;
                            }
                        }
                    }
                }
                else {
                    // put these in separate for loops for performance (less tests to perform within the for loops themselves)
                    if (p_OnRising && !p_OnFalling) {
                        // from the first index find the first crossing in the right direction
                        for (var risingIndex = firstIndex + 1; risingIndex < lastIndex; risingIndex++) {
                            if (DoubleArrays[signalIndex][risingIndex - 1] <= p_Value && DoubleArrays[signalIndex][risingIndex] > p_Value) {
                                triggerPoint = calcIntersectPoint(DoubleArrays[0][risingIndex - 1], DoubleArrays[signalIndex][risingIndex - 1], DoubleArrays[0][risingIndex], DoubleArrays[signalIndex][risingIndex], p_Value);
                                break;
                            }
                        }
                    }
                    else if (p_OnFalling && !p_OnRising) {
                        // from the first index find the first crossing in the right direction
                        for (var fallingIndex = firstIndex + 1; fallingIndex < lastIndex; fallingIndex++) {
                            if (DoubleArrays[signalIndex][fallingIndex - 1] >= p_Value && DoubleArrays[signalIndex][fallingIndex] < p_Value) {
                                triggerPoint = calcIntersectPoint(DoubleArrays[0][fallingIndex - 1], DoubleArrays[signalIndex][fallingIndex - 1], DoubleArrays[0][fallingIndex], DoubleArrays[signalIndex][fallingIndex], p_Value);
                                break;
                            }
                        }
                    }
                    else { // either
                        // from the first index find the first crossing in the right direction
                        for (var index = firstIndex + 1; index < lastIndex; index++) {
                            var eitherVal1 = DoubleArrays[signalIndex][index - 1];
                            var eitherVal2 = DoubleArrays[signalIndex][index];

                            if ((eitherVal1 >= p_Value && eitherVal2 < p_Value) || (eitherVal1 <= p_Value && eitherVal2 > p_Value)) {
                                triggerPoint = calcIntersectPoint(DoubleArrays[0][index - 1], DoubleArrays[signalIndex][index - 1], DoubleArrays[0][index], DoubleArrays[signalIndex][index], p_Value);
                                break;
                            }
                        }
                    }
                }
            }

            return triggerPoint;
        },
        getLimits: function () { return Limits; }, // retrieve the limits for the data
        // / get the data for the specified range. Data is decimated when it exceeds 2 * DecimationTarget. In general the decimation target should be set to the pixel width of the graph
        // / @param p_MinX : The minimum X value to get, we will return data starting from the first element that is smaller or equal to this value
        // / @param p_MaxX : The maximum X value to get, we will return data up until first element that is bigger or equal to this value inclusive
        // / @param p_DecimationTarget : The number of "pixels" for our decimation, if this value is not set it will use the value previous set with setDecimationTarget
        // / @param transform : Optional transform function
        // / @param p_RangeLimits : optional Object to receive the limits for this requested range
        // / @return The requested data as an array of data sets where each set consists of an x value followed by the y values (e.g. [[xvalue1, y1, y2, ...,yn-1,yn], [xvalue2, y1, y2, ...,yn-1,yn], ...] )
        // / if the data manager has no content this will return an array with a single set which contains all 0
        getData: function getData(p_MinX, p_MaxX, p_DecimationTarget, transform, p_RangeLimits) {
            var decTarget = p_DecimationTarget || DecimationTarget;
            var rangeLimits = p_RangeLimits || null;

            if (rangeLimits) {
                rangeLimits.minx = null;
                rangeLimits.maxx = null;
                rangeLimits.miny = null;
                rangeLimits.maxy = null;
                rangeLimits.serieslimits = [];
            }

            // make sure we have any data
            if (DataSize > 0 && DoubleArrays.length > 0) {
                // get start index of the data that must be returned
                console.log(DoubleArrays);
                var firstIndex = Math.max(0, p_MinX);
                // get the end index of the data that must be returned
                var lastIndex = Math.min(DataSize, 70000);

                console.log(lastIndex, firstIndex, decTarget);

                // decimate the data using min max decimation, to keep it simple we only decimate if the source data is at least 2 * the target size
                if ((lastIndex - firstIndex) > (decTarget * 2)) {
                    console.log('decimating');
                    // Ensure that if no transform is passed we use a linear transform
                    transform = transform || defaultTransform;

                    // if any of the parameters has changed we have to redo the full decimation so reset the cache
                    if (p_MinX != decimatedCache.min || p_MaxX != decimatedCache.max || decTarget != decimatedCache.decimationTarget || decimatedCache.transform != transform) {
                        resetDecimationCache();

                        decimatedCache.min = p_MinX;
                        decimatedCache.max = p_MaxX;
                        decimatedCache.decimationTarget = decTarget;
                        decimatedCache.transform = transform;
                    }
                    decimatedCache.dataSlice = decimate(DoubleArrays, firstIndex, lastIndex, decTarget, transform, rangeLimits);
                    console.log(decimatedCache.dataSlice);
                } else {
                    // No decimation necessary
                    decimatedCache.dataSlice = Names.map(function () { return []; });
                    decimatedCache.dataSlice.pop();

                    lastIndex = Math.min(lastIndex, DoubleArrays[0].length);

                    for (var nameIndex = 1; nameIndex < DoubleArrays.length; ++nameIndex) {
                        for (var dataIndex = firstIndex; dataIndex < lastIndex; ++dataIndex) {
                            decimatedCache.dataSlice[nameIndex - 1].push([DoubleArrays[0][dataIndex], DoubleArrays[nameIndex][dataIndex]]);
                        }
                    }
                }
            } else {
                decimatedCache.dataSlice = [];
                // return a single set of all 0
                Names.forEach(function () {
                    decimatedCache.dataSlice.push([]);
                });
                decimatedCache.dataSlice.pop(); // no data for time/frequency trace since we return points
            }

            if (rangeLimits && decimatedCache.dataSlice.length && decimatedCache.dataSlice[0].length) {
                rangeLimits.minx = decimatedCache.dataSlice[0][0][0];
                rangeLimits.maxx = decimatedCache.dataSlice[0][decimatedCache.dataSlice[0].length - 1][0];
                if (decimatedCache.dataSlice[0][0].length > 1) {
                    rangeLimits.miny = decimatedCache.dataSlice[0][0][1];
                    rangeLimits.maxy = decimatedCache.dataSlice[0][0][1];
                }
                else {
                    rangeLimits.miny = null;
                    rangeLimits.maxy = null;
                }

                decimatedCache.dataSlice.forEach(function (p_Series) {
                    var seriesLimit = { miny: (p_Series.length) ? p_Series[0][1] : null, maxy: (p_Series.length) ? p_Series[0][1] : null };

                    p_Series.forEach(function (p_DataItem) {
                        seriesLimit.miny = Math.min(seriesLimit.miny, p_DataItem[1]);
                        seriesLimit.maxy = Math.max(seriesLimit.maxy, p_DataItem[1]);
                    });

                    rangeLimits.serieslimits.push(seriesLimit);

                    if (rangeLimits.miny !== null && seriesLimit.maxy !== null) {
                        rangeLimits.miny = Math.min(rangeLimits.miny, seriesLimit.miny);
                        rangeLimits.maxy = Math.max(rangeLimits.maxy, seriesLimit.maxy);
                    }
                });
            }

            // return the data
            return decimatedCache.dataSlice;
        },
        get length() { return DataSize; },
        // / Get a raw copy of the data without any decimation
        // / @param p_Start : optional start index for the data, defaults to 0
        // / @param p_End : optional end index for the data, defaults to length, data will be retrieved upto this index but not including this index
        // / @return The requested data as an array of data sets where each set consists of an x value followed by the y values (e.g. [[xvalue1, y1, y2, ...,yn-1,yn], [xvalue2, y1, y2, ...,yn-1,yn], ...] )
        // / if the data manager has no content or if a zero or invalid range is selected, this will return an array with a single set which contains all 0
        getRawData: function getRawData(p_Start, p_End) {
            p_Start = Math.max(0, Math.min(DataSize, p_Start || 0)); // make sure the start index is smaller then the data size and greater than or equal to 0
            p_End = Math.max(p_Start, Math.min(DataSize, p_End || DataSize)); // make sure the start index is smaller then the data size and is bigger or equal to the start index

            var Data = [];
            if (DoubleArrays && DoubleArrays.length > 0 && DataSize > 0 && p_End > p_Start) {
                DoubleArrays.forEach(function (traceData) {
                    var newTraceData = [];

                    for (var index = p_Start; index < p_End; ++index) {
                        newTraceData.push(traceData[index]);
                    }

                    Data.push(newTraceData);
                });
            } else {
                // return a single set of all 0
                Names.forEach(function () {
                    Data.push([0]);
                });
            }

            return Data;
        },
        // / Convert the ugly spice signal name into a pretty string for display
        // / @param p_SignalName : the ugly signal name
        cleanUpSpiceSignalName: function cleanUpSpiceSignalName(p_SignalName) {
            displayName = p_SignalName;
            var displayName = displayName.replace(/\$(([\w]|[+\-\/*](?=[^$\{\()}]))+)/ig, 'V($1)'); // process voltage names into V(xxx)
            displayName = displayName.replace(/\-?@?((\w+:)*)\w(\w+)\[(\w)(\w+)\]/ig, '$4($3:$5)'); // process current names with a pin
            displayName = displayName.replace(/\-?@?((\w+:)*)\w(\w+)\[(\w)]/ig, '$4($3)'); // process current names with no pin
            displayName = displayName.replace(/^\s*\((.*)\)\s*$/, '$1'); // remove outer brackets
            displayName = displayName.toUpperCase().replace(' ', ''); // make it all upper case
            mapDisplayNameToSignal.set(displayName, p_SignalName); // record it in the map so that we can get it back later
            return displayName;
        },
        setDecimationTarget: function setDecimationTarget(p_Target) { DecimationTarget = p_Target; }, // Set the target for decimation, normally the pixel width of the target graph
        getDecimationTarget: function getDecimationTarget() { return DecimationTarget; },
        getSignalNames: function getSignalNames() { return Names; },
        getMeasurements: function getMeasurements(signalName) { return Measurements[Names.indexOf(signalName)]; },
        getLastValue: function getLastValue(signalName) {
            if (DataSize > 0 && DoubleArrays.length > 0 && Names.indexOf(signalName) !== -1) {
                return DoubleArrays[Names.indexOf(signalName)][DataSize - 1];
            }
        },
        get stale() { return stale; },
        set stale(newState) {
            setStale(newState);
        },
    };
})();

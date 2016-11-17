/* jquery.mousewheel.min.js
 * Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.0.6
 *
 * Requires: 1.2.2+
 */
(function (d) { function e(a) { var b = a || window.event, c = [].slice.call(arguments, 1), f = 0, e = 0, g = 0, a = d.event.fix(b); a.type = "mousewheel"; b.wheelDelta && (f = b.wheelDelta / 120); b.detail && (f = -b.detail / 3); g = f; void 0 !== b.axis && b.axis === b.HORIZONTAL_AXIS && (g = 0, e = -1 * f); void 0 !== b.wheelDeltaY && (g = b.wheelDeltaY / 120); void 0 !== b.wheelDeltaX && (e = -1 * b.wheelDeltaX / 120); c.unshift(a, f, e, g); return (d.event.dispatch || d.event.handle).apply(this, c) } var c = ["DOMMouseScroll", "mousewheel"]; if (d.event.fixHooks) for (var h = c.length; h;)d.event.fixHooks[c[--h]] = d.event.mouseHooks; d.event.special.mousewheel = { setup: function () { if (this.addEventListener) for (var a = c.length; a;)this.addEventListener(c[--a], e, !1); else this.onmousewheel = e }, teardown: function () { if (this.removeEventListener) for (var a = c.length; a;)this.removeEventListener(c[--a], e, !1); else this.onmousewheel = null } }; d.fn.extend({ mousewheel: function (a) { return a ? this.bind("mousewheel", a) : this.trigger("mousewheel") }, unmousewheel: function (a) { return this.unbind("mousewheel", a) } }) })(jQuery);

(function ($) {
    var options = {
        zoomPan: {
            enabled: false,
            secsPerDivisionValues: [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
                0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
                0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
            startingXIndex: 0,

            startingYIndexArray: [0, 0],
            selectedYAxis: 1,
            voltsPerDivisionValues: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],

            updateTimelineChart: false,
            timelineChartRef: null
        }
    };

    //Internal variables
    var previousXPosition;
    var previousYPosition;
    var panType;
    var wheelZoomX;
    var multiTouchEventContainer = {
        midPoint: null,
        previousX1: null,
        previousX2: null,
        previousY1: null,
        previousY2: null,
        startingMultiTouch: true,
        initialXDistance: null,
        initialYDistance: null,
        lastSuccessfulEventPositions: {
            previousX1: null,
            previousY1: null,
            previousX2: null,
            previousY2: null,
            xDistance: null,
            yDistance: null
        },
    };

    //Variables exposed in options
    var selectedYAxis;
    var secsPerDivisionValues;
    var voltsPerDivisionValues;
    var startingXIndex;
    var startingYIndexArray;
    var updateTimelineChart;
    var timelineChartRef;

    function init(plot) {

        /**************************************************************
        * Process Options
        **************************************************************/
        plot.hooks.processOptions.push(function (plot, options) {
            if (options.zoomPan.enabled) {
                console.log('zoom pan plugin enabled');

                //Read values. Options will be default defined above unless specified by developer
                selectedYAxis = options.zoomPan.selectedYAxis;
                secsPerDivisionValues = options.zoomPan.secsPerDivisionValues;
                voltsPerDivisionValues = options.zoomPan.voltsPerDivisionValues;
                startingXIndex = options.zoomPan.startingXIndex;
                startingYIndexArray = options.zoomPan.startingYIndexArray;
                updateTimelineChart = options.zoomPan.updateTimelineChart;
                timelineChartRef = options.zoomPan.timelineChartRef;

                //Setup Chart
                setupChart(plot);
            }
        });

        /**************************************************************
        * Sets Up Plugin
        **************************************************************/
        function setupChart(plot) {

            /**************************************************************
            * User Accessible Functions
            **************************************************************/
            plot.getActiveXIndex = function getActiveXIndex() {
                return startingXIndex;
            }

            plot.setActiveXIndex = function setActiveXIndex(index) {
                startingXIndex = index;
            }

            plot.getActiveYIndices = function getActiveYIndices() {
                return startingYIndexArray;
            }

            plot.setActiveYIndices = function setActiveYIndexArray(indexArray) {
                startingYIndexArray = indexArray;
            }

            plot.getActiveYAxis = function getActiveYAxis() {
                return selectedYAxis;
            }

            plot.setActiveYAxis = function setActiveYAxis(activeYAxisNumber) {
                selectedYAxis = activeYAxisNumber;
            }

            plot.getSecsPerDivArray = function getSecsPerDivArray() {
                return secsPerDivisionValues;
            }

            plot.setSecsPerDivArray = function setSecsPerDivArray(secsPerDivArray) {
                secsPerDivisionValues = secsPerDivArray;
            }

            plot.getVoltsPerDivArray = function getVoltsPerDivArray() {
                return voltsPerDivisionValues;
            }

            plot.setVoltsPerDivArray = function setVoltsPerDivArray(voltsPerDivArray) {
                voltsPerDivisionValues = voltsPerDivArray;
            }

            plot.getTimelineRef = function getTimelineRef() {
                return timelineChartRef;
            }

            plot.setTimelineRef = function setTimelineRef(timelineRef) {
                timelineChartRef = timelineRef;
            }

            plot.getTimelineUpdate = function getTimelineUpdate() {
                return updateTimelineChart;
            }

            plot.setTimelineUpdate = function setTimelineUpdate(update) {
                updateTimelineChart = update;
            }

            /**************************************************************
            * Event Functions
            **************************************************************/
            function chartMouseDown(e) {

                previousXPosition = e.clientX;
                previousYPosition = e.clientY;

                if (e.shiftKey) {
                    panType = 'vertical';
                    plot.getPlaceholder().bind('mousemove', vertPanChart);
                }
                else {
                    panType = 'horizontal';
                    plot.getPlaceholder().bind('mousemove', horPanChart);
                }
            }

            function touchDown(e) {
                //Use e.originalEvent since jquery does stuff to the event object.
                console.log('touchdown');
                console.log(e);
                //alert(e.originalEvent.touches.length);
                if (e.originalEvent.touches.length === 1) {
                    previousXPosition = e.originalEvent.touches[0].clientX;
                    previousYPosition = e.originalEvent.touches[0].clientY;
                    plot.getPlaceholder().bind('touchmove', touchMove);
                }
            }

            function multiTouch(e) {
                var positionX1 = e.originalEvent.touches[0].clientX;
                var positionX2 = e.originalEvent.touches[1].clientX;
                var positionY1 = e.originalEvent.touches[0].clientY;
                var positionY2 = e.originalEvent.touches[1].clientY;
                var midPoint = (positionX1 + positionX2) / 2;
                var xDistance = Math.abs(positionX1 - positionX2);
                var yDistance = Math.abs(positionY1 - positionY2);

                //Set initial tpd and vpd values
                var getAxes = plot.getAxes();
                var offsets = plot.offset();
                var timePerDivision = (getAxes.xaxis.max - getAxes.xaxis.min) / 10;
                var yaxisIndexer = 'y' + (selectedYAxis === 1 ? '' : selectedYAxis.toString()) + 'axis';
                var voltsPerDivision = (getAxes[yaxisIndexer].max - getAxes[yaxisIndexer].min) / 10;

                if (multiTouchEventContainer.startingMultiTouch) {
                    //new multitouch event. Setup event container and exit.
                    multiTouchEventContainer.startingMultiTouch = false;
                    multiTouchEventContainer.initialXDistance = Math.abs(positionX1 - positionX2);
                    multiTouchEventContainer.initialYDistance = Math.abs(positionY1 - positionY2);
                    multiTouchEventContainer.lastSuccessfulEventPositions.previousX1 = positionX1;
                    multiTouchEventContainer.lastSuccessfulEventPositions.previousY1 = positionY1;
                    multiTouchEventContainer.lastSuccessfulEventPositions.previousX2 = positionX2;
                    multiTouchEventContainer.lastSuccessfulEventPositions.previousY2 = positionY2;
                    multiTouchEventContainer.lastSuccessfulEventPositions.xDistance = xDistance;
                    multiTouchEventContainer.lastSuccessfulEventPositions.yDistance = yDistance;
                    multiTouchEventContainer.previousX1 = positionX1;
                    multiTouchEventContainer.previousY1 = positionY1;
                    multiTouchEventContainer.previousX2 = positionX2;
                    multiTouchEventContainer.previousY2 = positionY2;
                    multiTouchEventContainer.midPoint = midPoint;
                    return;
                }
                else {
                    var zoomMargin = plot.width() / 10;
                    var pixelsPerDiv = zoomMargin;

                    //var newFinger1DivPos = (positionX1 - offsets.left) / pixelsPerDiv; //Precise distance from left in #divs
                    //var newFinger2DivPos = (positionX2 - offsets.left) / pixelsPerDiv;
                    //var prevFinger1DivPos = (multiTouchEventContainer.previousX1 - offsets.left) / pixelsPerDiv;
                    //var prevFinger2DivPos = (multiTouchEventContainer.previousX2 - offsets.left) / pixelsPerDiv;
                    var deltaFinger1 = positionX1 - multiTouchEventContainer.previousX1;
                    var deltaFinger2 = positionX2 - multiTouchEventContainer.previousX2;
                    var deltaFinger1ValDiff = getAxes.xaxis.c2p(deltaFinger1);
                    var deltaFinger2ValDiff = getAxes.xaxis.c2p(deltaFinger2);
                    //alert(deltaFinger1ValDiff, deltaFinger2ValDiff, 'hey');


                    //use previous multitouch for context
                    /*var finger1MovedLR = positionX1 < multiTouchEventContainer.lastSuccessfulEventPositions.previousX1 - zoomMargin ||
                        positionX1 > multiTouchEventContainer.lastSuccessfulEventPositions.previousX1 + zoomMargin;
                    var finger1MovedUD = positionY1 < multiTouchEventContainer.lastSuccessfulEventPositions.previousY1 - zoomMargin ||
                        positionY1 > multiTouchEventContainer.lastSuccessfulEventPositions.previousY1 + zoomMargin;
                    var finger2MovedLR = positionX2 > multiTouchEventContainer.lastSuccessfulEventPositions.previousX2 + zoomMargin ||
                        positionX2 < multiTouchEventContainer.lastSuccessfulEventPositions.previousX2 - zoomMargin;
                    var finger2MovedUD = positionY2 > multiTouchEventContainer.lastSuccessfulEventPositions.previousY2 + zoomMargin ||
                        positionY2 < multiTouchEventContainer.lastSuccessfulEventPositions.previousY2 - zoomMargin;

                    var zoomChange = false;*/

                    /*if (finger1MovedLR || finger2MovedLR) {
                        if (xDistance < multiTouchEventContainer.lastSuccessfulEventPositions.xDistance - zoomMargin && startingXIndex < secsPerDivisionValues.length - 1) {
                            //zoom out
                            startingXIndex++;
                            timePerDivision = secsPerDivisionValues[startingXIndex];
                            zoomChange = true;
                        }
                        else if (xDistance > multiTouchEventContainer.lastSuccessfulEventPositions.xDistance + zoomMargin && startingXIndex > 0) {
                            //zoom in
                            startingXIndex--;
                            timePerDivision = secsPerDivisionValues[startingXIndex];
                            zoomChange = true;
                        }
                    }
                    if (finger1MovedUD || finger2MovedUD) {
                        //alert('zoom vert');
                    }*/

                    /*if (zoomChange) {
                        multiTouchEventContainer.lastSuccessfulEventPositions.previousX1 = positionX1;
                        multiTouchEventContainer.lastSuccessfulEventPositions.previousY1 = positionY1;
                        multiTouchEventContainer.lastSuccessfulEventPositions.previousX2 = positionX2;
                        multiTouchEventContainer.lastSuccessfulEventPositions.previousY2 = positionY2;
                        multiTouchEventContainer.lastSuccessfulEventPositions.xDistance = xDistance;
                        multiTouchEventContainer.lastSuccessfulEventPositions.yDistance = yDistance;
                    }*/
                }

                /*var newVal = getAxes.xaxis.c2p(midPoint - offsets.left);
                var oldValinNewWindow = getAxes.xaxis.c2p(multiTouchEventContainer.midPoint - offsets.left)
                var difference = newVal - oldValinNewWindow;
                var base = (getAxes.xaxis.max + getAxes.xaxis.min) / 2;
                var yBase = (getAxes[yaxisIndexer].max + getAxes[yaxisIndexer].min) / 2;
                var newPos = base - difference;
                var min = newPos - timePerDivision * 5;
                var max = newPos + timePerDivision * 5;
                var yMin = yBase - voltsPerDivision * 5;
                var yMax = yBase + voltsPerDivision * 5;*/
                var min = getAxes.xaxis.min + deltaFinger1ValDiff;
                var max = getAxes.xaxis.max - deltaFinger2ValDiff;
                //alert(deltaFinger2ValDiff);
                getAxes.xaxis.options.min = min;
                getAxes.xaxis.options.max = max;
                //getAxes[yaxisIndexer].options.min = yMin;
                //getAxes[yaxisIndexer].options.max = yMax;
                if (isNaN(min) || isNaN(max)) {
                    alert('Error Setting Window');
                    return;
                }
                plot.setupGrid();
                plot.draw();
                var infoContainer = {
                    x: midPoint,
                    y: e.originalEvent.touches[0].clientY,
                    min: min,
                    max: max,
                    mid: 0,
                    axisNum: 1,
                    axis: 'xaxis'
                };
                plot.getPlaceholder().trigger('panEvent', [infoContainer]);
                if (updateTimelineChart && timelineChartRef != null) {
                    timelineChartRef.updateTimelineCurtains(infoContainer)
                }

                multiTouchEventContainer.previousX1 = positionX1;
                multiTouchEventContainer.previousY1 = positionY1;
                multiTouchEventContainer.previousX2 = positionX2;
                multiTouchEventContainer.previousY2 = positionY2;
                multiTouchEventContainer.midPoint = midPoint;
            }

            function singleTouch(e) {
                var getAxes = plot.getAxes();
                var offsets = plot.offset();
                var newVal = getAxes.xaxis.c2p(e.originalEvent.touches[0].clientX - offsets.left);
                var oldValinNewWindow = getAxes.xaxis.c2p(previousXPosition - offsets.left)
                var difference = newVal - oldValinNewWindow;
                var base = (getAxes.xaxis.max + getAxes.xaxis.min) / 2;
                var timePerDivision = (getAxes.xaxis.max - getAxes.xaxis.min) / 10;
                var newPos = base - difference;
                var min = newPos - timePerDivision * 5;
                var max = newPos + timePerDivision * 5;
                getAxes.xaxis.options.min = min;
                getAxes.xaxis.options.max = max;
                if (isNaN(min) || isNaN(max)) {
                    alert('nan');
                    return;
                }
                plot.setupGrid();
                plot.draw();
                var infoContainer = {
                    x: e.originalEvent.touches[0].clientX,
                    y: e.originalEvent.touches[0].clientY,
                    min: min,
                    max: max,
                    mid: newPos,
                    axisNum: 1,
                    axis: 'xaxis'
                };
                plot.getPlaceholder().trigger('panEvent', [infoContainer]);
                if (updateTimelineChart && timelineChartRef != null) {
                    timelineChartRef.updateTimelineCurtains(infoContainer)
                }
                previousXPosition = e.originalEvent.touches[0].clientX;
            }

            function touchMove(e) {
                if (e.originalEvent.touches.length > 1) {
                    multiTouch(e);
                }
                else {
                    multiTouchEventContainer.startingMultiTouch = true;
                    singleTouch(e);
                }
            }

            function touchEnd(e) {
                multiTouchEventContainer.startingMultiTouch = true;
                plot.getPlaceholder().unbind('touchmove', touchMove);
            }

            function chartMouseUp(e) {
                if (panType === 'vertical') {
                    plot.getPlaceholder().unbind('mousemove', vertPanChart);
                }
                else {
                    plot.getPlaceholder().unbind('mousemove', horPanChart);
                }
            }

            function mouseWheel(e, delta) {
                wheelZoomX = !e.shiftKey;
                if (wheelZoomX) {
                    if (delta < 0 && startingXIndex < secsPerDivisionValues.length - 1) {
                        startingXIndex++;
                        mouseWheelRedraw();
                    }
                    else if (delta > 0 && startingXIndex > 0) {
                        startingXIndex--;
                        mouseWheelRedraw();
                    }
                }
                else {
                    if (delta < 0 && startingYIndexArray[selectedYAxis - 1] < voltsPerDivisionValues.length - 1) {
                        startingYIndexArray[selectedYAxis - 1]++;
                        mouseWheelRedraw();
                    }
                    else if (delta > 0 && startingYIndexArray[selectedYAxis - 1] > 0) {
                        startingYIndexArray[selectedYAxis - 1]--;
                        mouseWheelRedraw();
                    }
                }
            }

            function mouseWheelRedraw() {
                var getAxes = plot.getAxes();
                var infoContainer;
                if (wheelZoomX) {
                    var base = (getAxes.xaxis.max + getAxes.xaxis.min) / 2;
                    var min = base - secsPerDivisionValues[startingXIndex] * 5;
                    var max = base + secsPerDivisionValues[startingXIndex] * 5;
                    getAxes.xaxis.options.min = min;
                    getAxes.xaxis.options.max = max;
                    infoContainer = {
                        min: min,
                        max: max,
                        mid: base,
                        perDivVal: secsPerDivisionValues[startingXIndex],
                        perDivArrayIndex: startingXIndex,
                        axisNum: 1,
                        axis: 'xaxis'
                    };
                    plot.getPlaceholder().trigger('mouseWheelRedraw', [infoContainer]);
                }
                else {
                    var yaxisIndexer = 'y' + (selectedYAxis === 1 ? '' : selectedYAxis.toString()) + 'axis';
                    var base = (getAxes[yaxisIndexer].max + getAxes[yaxisIndexer].min) / 2;
                    var min = base - voltsPerDivisionValues[startingYIndexArray[selectedYAxis - 1]] * 5;
                    var max = base + voltsPerDivisionValues[startingYIndexArray[selectedYAxis - 1]] * 5;
                    getAxes[yaxisIndexer].options.min = min;
                    getAxes[yaxisIndexer].options.max = max;
                    infoContainer = {
                        min: min,
                        max: max,
                        mid: base,
                        perDivVal: voltsPerDivisionValues[startingYIndexArray[selectedYAxis - 1]],
                        perDivArrayIndex: startingYIndexArray[selectedYAxis - 1],
                        axisNum: selectedYAxis,
                        axis: yaxisIndexer
                    };
                    plot.getPlaceholder().trigger('mouseWheelRedraw', [infoContainer]);
                }

                plot.setupGrid();
                plot.draw();

                if (updateTimelineChart && timelineChartRef != null) {
                    timelineChartRef.updateTimelineCurtains(infoContainer)
                }
            }

            function vertPanChart(e) {
                var yaxisIndexer = 'y' + (selectedYAxis === 1 ? '' : selectedYAxis.toString()) + 'axis';
                var getAxes = plot.getAxes();
                var newVal = getAxes[yaxisIndexer].c2p(e.clientY);
                var oldValinNewWindow = getAxes[yaxisIndexer].c2p(previousYPosition);
                var difference = newVal - oldValinNewWindow;
                var base = (getAxes[yaxisIndexer].max + getAxes[yaxisIndexer].min) / 2;
                var voltsPerDivision = (getAxes[yaxisIndexer].max - getAxes[yaxisIndexer].min) / 10;
                var newPos = base - difference;
                var min = newPos - voltsPerDivision * 5;
                var max = newPos + voltsPerDivision * 5;
                getAxes[yaxisIndexer].options.min = min;
                getAxes[yaxisIndexer].options.max = max;
                plot.setupGrid();
                plot.draw();
                previousYPosition = e.clientY;
                plot.getPlaceholder().trigger('panEvent', [
                    {
                        x: e.clientX,
                        y: e.clientY,
                        min: min,
                        max: max,
                        mid: newPos,
                        axisNum: selectedYAxis,
                        axis: yaxisIndexer
                    }
                ]);
            }

            function horPanChart(e) {
                var getAxes = plot.getAxes();
                var newVal = getAxes.xaxis.c2p(e.clientX);
                var oldValinNewWindow = getAxes.xaxis.c2p(previousXPosition);
                var difference = newVal - oldValinNewWindow;
                var base = (getAxes.xaxis.max + getAxes.xaxis.min) / 2;
                var timePerDivision = (getAxes.xaxis.max - getAxes.xaxis.min) / 10;
                var newPos = base - difference;
                var min = newPos - timePerDivision * 5;
                var max = newPos + timePerDivision * 5;
                getAxes.xaxis.options.min = min;
                getAxes.xaxis.options.max = max;
                plot.setupGrid();
                plot.draw();
                var infoContainer = {
                    x: e.clientX,
                    y: e.clientY,
                    min: min,
                    max: max,
                    mid: newPos,
                    axisNum: 1,
                    axis: 'xaxis'
                };
                plot.getPlaceholder().trigger('panEvent', [infoContainer]);
                if (updateTimelineChart && timelineChartRef != null) {
                    timelineChartRef.updateTimelineCurtains(infoContainer)
                }
                previousXPosition = e.clientX;
            }

            /**************************************************************
            * Bind Events
            **************************************************************/
            plot.hooks.bindEvents.push(function (plot, eventHolder) {
                eventHolder.mousedown(chartMouseDown);
                eventHolder.bind('touchstart', touchDown);
                eventHolder.bind('touchend', touchEnd);
                eventHolder.mouseup(chartMouseUp);
                eventHolder.mouseout(chartMouseUp);
                eventHolder.mousewheel(mouseWheel);
            });

            /**************************************************************
            * Unbind Events
            **************************************************************/
            plot.hooks.shutdown.push(function (plot, eventHolder) {
                eventHolder.unbind('mousedown', chartMouseDown);
                eventHolder.unbind('touchstart', touchDown);
                eventHolder.unbind('touchend', touchEnd);
                eventHolder.unbind('mouseup', chartMouseUp);
                eventHolder.unbind('mouseout', chartMouseUp);
                eventHolder.unbind('mousewheel', mouseWheel);
                eventHolder.unbind('panEvent');
                eventHolder.unbind('mouseWheelRedraw');
            });
        }
    }
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'zoomPan',
        version: '0.1'
    });
})(jQuery);
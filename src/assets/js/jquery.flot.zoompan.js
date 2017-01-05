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
        startingMultiTouch: true
    };
    var highlightContainer = {
        highlighting: false,
        start: 0
    }

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

                //Read values. Options will be default defined above unless specified in options
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

            plot.unbindMoveEvents = function unbindMoveEvents() {
                plot.getPlaceholder().unbind('mousemove', vertPanChart);
                plot.getPlaceholder().unbind('mousemove', horPanChart);
                plot.getPlaceholder().unbind('touchmove', touchMove);
            }

            /**************************************************************
            * Event Functions
            **************************************************************/
            function chartMouseDown(e) {

                if ((e.button && e.button === 1) || (e.which && e.which === 2)) {
                    e.preventDefault();
                    var offsets = plot.offset();
                    plot.getPlaceholder().append('<div id="plot-highlight-div"></div>').bind('mousemove', middleMouseMove);
                    $('#plot-highlight-div').bind('mouseup', chartMouseUp);
                    highlightContainer.highlighting = true;
                    highlightContainer.start = e.clientX;
                    return;
                }

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

            function middleMouseMove(e) {
                e.preventDefault();
                var offsets = plot.offset();
                var margins = plot.getOptions().grid.margin;
                $('#plot-highlight-div').css({
                    "position": "absolute",
                    "top": margins.top.toString() + 'px',
                    "bottom": (plot.getPlaceholder().height() - margins.top - plot.height()).toString() + 'px',
                    "left": (highlightContainer.start < e.clientX ? highlightContainer.start : e.clientX).toString() + 'px',
                    "width": (Math.abs(e.clientX - highlightContainer.start)).toString() + 'px',
                    "backgroundColor": 'rgba(182, 191, 190, 0.3)'
                });
            }

            function touchDown(e) {
                //Use e.originalEvent since jquery does stuff to the event object.
                if (e.originalEvent.touches.length === 1) {
                    previousXPosition = e.originalEvent.touches[0].clientX;
                    previousYPosition = e.originalEvent.touches[0].clientY;
                    plot.getPlaceholder().bind('touchmove', touchMove);
                }
                else if (e.originalEvent.touches.length > 1) {
                    multiTouchEventContainer.startingMultiTouch = true;
                }
            }

            function multiTouch(e) {
                var positionX1 = e.originalEvent.touches[0].clientX;
                var positionX2 = e.originalEvent.touches[1].clientX;
                var positionY1 = e.originalEvent.touches[0].clientY;
                var positionY2 = e.originalEvent.touches[1].clientY;
                var midPoint = (positionX1 + positionX2) / 2;

                //Set initial tpd and vpd values
                var getAxes = plot.getAxes();
                var offsets = plot.offset();

                if (multiTouchEventContainer.startingMultiTouch) {
                    //new multitouch event. Setup event container and exit.
                    multiTouchEventContainer.startingMultiTouch = false;
                    multiTouchEventContainer.previousX1 = positionX1;
                    multiTouchEventContainer.previousY1 = positionY1;
                    multiTouchEventContainer.previousX2 = positionX2;
                    multiTouchEventContainer.previousY2 = positionY2;
                    multiTouchEventContainer.midPoint = midPoint;
                    return;
                }
                else {
                    var plotWidth = plot.width();
                    var oldUnitLeft = getAxes.xaxis.c2p(multiTouchEventContainer.previousX1 - offsets.left);
                    var oldUnitRight = getAxes.xaxis.c2p(multiTouchEventContainer.previousX2 - offsets.left)
                    var oldUnitValDif = Math.abs(oldUnitLeft - oldUnitRight);
                    var newUnitPerPix = oldUnitValDif / Math.abs(positionX1 - positionX2);
                    var max = oldUnitRight + newUnitPerPix * (plotWidth - (positionX2 - offsets.left));
                    var min = oldUnitLeft - newUnitPerPix * (positionX1 - offsets.left);
                }
                if (isNaN(min) || isNaN(max)) {
                    alert('Error Setting Window');
                    return;
                }
                getAxes.xaxis.options.min = min;
                getAxes.xaxis.options.max = max;
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
                if (isNaN(min) || isNaN(max)) {
                    alert('nan');
                    return;
                }
                getAxes.xaxis.options.min = min;
                getAxes.xaxis.options.max = max;
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
                e.preventDefault();
                if (e.originalEvent.touches.length > 1) {
                    multiTouch(e);
                }
                else {
                    multiTouchEventContainer.startingMultiTouch = true;
                    singleTouch(e);
                }
            }

            function touchEnd(e) {
                if (e.originalEvent.touches.length === 0) {
                    plot.getPlaceholder().unbind('touchmove', touchMove);
                }
                var xaxis = plot.getAxes().xaxis;
                var timePerDiv = (xaxis.max - xaxis.min) / 10;
                var count = 0;
                while (secsPerDivisionValues[count] < timePerDiv && count < secsPerDivisionValues.length) {
                    count++;
                }
                startingXIndex = count;
                var infoContainer = {
                    min: xaxis.min,
                    max: xaxis.max,
                    mid: (xaxis.max + xaxis.min) / 2,
                    perDivVal: timePerDiv,
                    perDivArrayIndex: startingXIndex,
                    axisNum: 1,
                    axis: 'xaxis'
                };
                plot.getPlaceholder().trigger('mouseWheelRedraw', [infoContainer]);
                if (e.originalEvent.touches.length > 0) { previousXPosition = e.originalEvent.touches[0].clientX; }
                multiTouchEventContainer.startingMultiTouch = true;
            }

            function chartMouseUp(e) {
                if (panType === 'vertical') {
                    panType = null;
                    plot.getPlaceholder().unbind('mousemove', vertPanChart);
                }
                else if (panType === 'horizontal') {
                    panType = null;
                    plot.getPlaceholder().unbind('mousemove', horPanChart);
                }
                else if (highlightContainer.highlighting) {
                    if (e.type === 'mouseout' && e.clientX < plot.width() && e.clientX > 0) {
                        //Do this because the mouse can go over the highlight div and cause a mouseout event
                        middleMouseMove(e);
                        return;
                    }
                    plot.getPlaceholder().unbind('mousemove', middleMouseMove);
                    highlightContainer.highlighting = false;
                    $('#plot-highlight-div').remove();
                    zoomOnMiddleMouseSelection(highlightContainer.start, e.clientX);
                }
            }

            function zoomOnMiddleMouseSelection(startPx, stopPx) {
                var xaxis = plot.getAxes().xaxis;
                var offsets = plot.offset();
                var startVal = xaxis.c2p(startPx - offsets.left);
                var finishVal = xaxis.c2p(stopPx - offsets.left);
                if (startVal > finishVal) {
                    var tempSwap = startVal;
                    startVal = finishVal;
                    finishVal = tempSwap;
                }
                xaxis.options.min = startVal;
                xaxis.options.max = finishVal;
                plot.setupGrid();
                plot.draw();
                var timePerDiv = (xaxis.max - xaxis.min) / 10;
                var count = 0;
                while (secsPerDivisionValues[count] < timePerDiv && count < secsPerDivisionValues.length) {
                    count++;
                }
                startingXIndex = count;
                var infoContainer = {
                    min: xaxis.min,
                    max: xaxis.max,
                    mid: (xaxis.max + xaxis.min) / 2,
                    perDivVal: timePerDiv,
                    perDivArrayIndex: startingXIndex,
                    axisNum: 1,
                    axis: 'xaxis'
                };
                plot.getPlaceholder().trigger('mouseWheelRedraw', [infoContainer]);
                if (updateTimelineChart && timelineChartRef != null) {
                    timelineChartRef.setActiveXIndex(startingXIndex);
                    timelineChartRef.updateTimelineCurtains(infoContainer);
                }
            }

            function mouseWheel(e, delta) {
                e.preventDefault();
                wheelZoomX = !e.shiftKey;
                if (wheelZoomX) {
                    if (delta < 0 && startingXIndex < secsPerDivisionValues.length - 1) {
                        startingXIndex++;
                        mouseWheelRedraw(e);
                    }
                    else if (delta > 0 && startingXIndex > 0) {
                        startingXIndex--;
                        mouseWheelRedraw(e);
                    }
                }
                else {
                    if (delta < 0 && startingYIndexArray[selectedYAxis - 1] < voltsPerDivisionValues.length - 1) {
                        startingYIndexArray[selectedYAxis - 1]++;
                        mouseWheelRedraw(e);
                    }
                    else if (delta > 0 && startingYIndexArray[selectedYAxis - 1] > 0) {
                        startingYIndexArray[selectedYAxis - 1]--;
                        mouseWheelRedraw(e);
                    }
                }
            }

            function mouseWheelRedraw(e) {
                var getAxes = plot.getAxes();
                var infoContainer;
                if (wheelZoomX) {
                    var offsets = plot.offset();
                    var newValPerPix = (secsPerDivisionValues[startingXIndex] * 10) / plot.width();
                    var mousePix = e.clientX - offsets.left;
                    var mouseVal = getAxes.xaxis.c2p(mousePix);
                    var min = mouseVal - newValPerPix * mousePix;
                    var max = min + 10 * secsPerDivisionValues[startingXIndex];
                    getAxes.xaxis.options.min = min;
                    getAxes.xaxis.options.max = max;
                    var newMidPoint = (max + min) / 2
                    infoContainer = {
                        min: min,
                        max: max,
                        mid: newMidPoint,
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
                    timelineChartRef.setActiveXIndex(startingXIndex);
                    timelineChartRef.updateTimelineCurtains(infoContainer);
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
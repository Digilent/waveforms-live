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
        timelineChart: {
            enabled: false,
            secsPerDivisionValues: [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
                0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
                0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
            startingXIndex: 0,

            updateExistingChart: false,
            existingChartRef: null
        }
    };

    //Internal variables
    var previousXPosition;

    //Variables exposed in options
    var secsPerDivisionValues;
    var startingXIndex;
    var existingChartRef;
    var updateExistingChart;

    function init(plot) {

        /**************************************************************
        * Process Options
        **************************************************************/
        plot.hooks.processOptions.push(function (plot, options) {
            if (options.timelineChart.enabled) {
                console.log('timeline plugin enabled');

                //Read values. Options will be default defined above unless specified by options
                secsPerDivisionValues = options.timelineChart.secsPerDivisionValues;
                startingXIndex = options.timelineChart.startingXIndex;
                existingChartRef = options.timelineChart.existingChartRef;
                updateExistingChart = options.timelineChart.updateExistingChart;

                //Setup Chart
                setupChart(plot);
            }
        });

        /**************************************************************
        * Sets Up Plugin
        **************************************************************/
        function setupChart(plot) {
            /**************************************************************
            * Add Initial Curtains to Timeline
            **************************************************************/
            addCurtains();

            /**************************************************************
            * User Accessible Functions
            **************************************************************/
            plot.getActiveXIndex = function getActiveXIndex() {
                return startingXIndex;
            }

            plot.setActiveXIndex = function setActiveXIndex(index) {
                startingXIndex = index;
            }

            plot.getSecsPerDivArray = function getSecsPerDivArray() {
                return secsPerDivisionValues;
            }

            plot.setSecsPerDivArray = function setSecsPerDivArray(secsPerDivArray) {
                secsPerDivisionValues = secsPerDivArray;
            }

            plot.getExistingChartRef = function getExistingChartRef() {
                return existingChartRef;
            }

            plot.setExistingChartRef = function setExistingChartRef(newExistingChartRef) {
                existingChartRef = newExistingChartRef;
            }

            plot.updateExistingChart = function updateExistingChart() {
                updateExistingChart = true;
            }

            plot.noUpdateExistingChart = function noUpdateExistingChart() {
                updateExistingChart = false;
            }

            plot.updateTimelineCurtains = function updateTimelineCurtains(newChartInfoContainer) {
                var timelineAxes = plot.getAxes();
                var leftCor = timelineAxes.xaxis.min;
                var leftCorStop = newChartInfoContainer.min;
                var rightCor = timelineAxes.xaxis.max;
                var rightCorStop = newChartInfoContainer.max;
                var cursorRefs = plot.getCursors();
                var leftBandWidth = timelineAxes.xaxis.p2c(leftCorStop) - timelineAxes.xaxis.p2c(leftCor) + 10;
                var rightBandWidth = timelineAxes.xaxis.p2c(rightCor) - timelineAxes.xaxis.p2c(rightCorStop) + 10;

                var leftLinePos = timelineAxes.xaxis.c2p(timelineAxes.xaxis.p2c(leftCorStop) - 5);
                var rightLinePos = timelineAxes.xaxis.c2p(timelineAxes.xaxis.p2c(rightCorStop) + 5);

                var leftBandPos = timelineAxes.xaxis.c2p(timelineAxes.xaxis.p2c((leftCor + leftCorStop) / 2) - 5);
                var rightBandPos = timelineAxes.xaxis.c2p(timelineAxes.xaxis.p2c((rightCor + rightCorStop) / 2) + 5);

                leftBandWidth = leftBandWidth < 18 ? 0 : leftBandWidth;
                rightBandWidth = rightBandWidth < 18 ? 0 : rightBandWidth;
                
                var leftCurtainLineWidth = leftBandWidth === 0 ? 0 : 10;
                var rightCurtainLineWidth = rightBandWidth === 0 ? 0 : 10;

                var cursorsToUpdate = cursorRefs;
                if (cursorRefs.length > 4) {
                    cursorsToUpdate = [];
                    for (var i = 0; i < cursorRefs.length; i++) {
                        if (cursorRefs[i].name === 'curtain-1' || cursorRefs[i].name === 'curtain-2' || cursorRefs[i].name === 'band-1' || cursorRefs[i].name === 'band-2') {
                            cursorsToUpdate.push(cursorRefs[i]);
                        }
                    }
                }

                var optionsArray = [];
                optionsArray[0] = {
                    lineWidth: leftCurtainLineWidth,
                    position: {
                        x: leftLinePos,
                        relativeY: 0.5
                    }
                };
                optionsArray[1] = {
                    lineWidth: rightCurtainLineWidth,
                    position: {
                        x: rightLinePos,
                        relativeY: 0.5
                    }
                };
                optionsArray[2] = {
                    lineWidth: leftBandWidth,
                    position: {
                        x: leftBandPos,
                        relativeY: 0.5
                    }
                };
                optionsArray[3] = {
                    lineWidth: rightBandWidth,
                    position: {
                        x: rightBandPos,
                        relativeY: 0.5
                    }
                };

                plot.setMultipleCursors(cursorsToUpdate, optionsArray);
            }

            /**************************************************************
            * Event Functions
            **************************************************************/
            function timelineMouseDown(e) {

                previousXPosition = e.clientX;
                previousYPosition = e.clientY;

                var chartAxes = existingChartRef.getAxes();
                var timelineAxes = plot.getAxes();
                var leftBoundVal = chartAxes.xaxis.min;
                var rightBoundVal = chartAxes.xaxis.max;
                var eventVal = timelineAxes.xaxis.c2p(e.clientX - plot.offset().left);
                if ((eventVal < leftBoundVal || eventVal > rightBoundVal) && updateExistingChart) {
                    //Center chart on the click event.
                    if (existingChartRef == null) { return; }
                    var existingChartGetAxes = existingChartRef.getAxes();
                    var newPos = timelineAxes.xaxis.c2p(e.clientX - plot.offset().left);
                    var timePerDivision = (existingChartGetAxes.xaxis.max - existingChartGetAxes.xaxis.min) / 10;
                    var min = newPos - timePerDivision * 5;
                    var max = newPos + timePerDivision * 5;
                    existingChartGetAxes.xaxis.options.min = min;
                    existingChartGetAxes.xaxis.options.max = max;
                    existingChartRef.setupGrid();
                    existingChartRef.draw();
                    plot.updateTimelineCurtains({
                        min: min,
                        max: max
                    });
                }
                plot.getPlaceholder().bind('mousemove', horPanTimeline);
            }

            function timelineTouchDown(e) {
                previousXPosition = e.originalEvent.touches[0].clientX;
                previousYPosition = e.originalEvent.touches[0].clientY;

                if (e.originalEvent.touches.length === 1) {

                    var chartAxes = existingChartRef.getAxes();
                    var timelineAxes = plot.getAxes();
                    var leftBoundVal = chartAxes.xaxis.min;
                    var rightBoundVal = chartAxes.xaxis.max;
                    var eventVal = timelineAxes.xaxis.c2p(previousXPosition - plot.offset().left);

                    if ((eventVal < leftBoundVal || eventVal > rightBoundVal) && updateExistingChart) {
                        //Center chart on the click event.
                        if (existingChartRef == null) { return; }
                        var existingChartGetAxes = existingChartRef.getAxes();
                        var newPos = timelineAxes.xaxis.c2p(previousXPosition - plot.offset().left);
                        var timePerDivision = (existingChartGetAxes.xaxis.max - existingChartGetAxes.xaxis.min) / 10;
                        var min = newPos - timePerDivision * 5;
                        var max = newPos + timePerDivision * 5;
                        existingChartGetAxes.xaxis.options.min = min;
                        existingChartGetAxes.xaxis.options.max = max;
                        existingChartRef.setupGrid();
                        existingChartRef.draw();
                        plot.updateTimelineCurtains({
                            min: min,
                            max: max
                        });
                    }
                    plot.getPlaceholder().bind('touchmove', timelineTouchMove);
                }
            }

            function timelineTouchMove(e) {
                //update existing chart if enabled
                if (updateExistingChart) {
                    if (existingChartRef == null) { return; }

                    var getAxes = plot.getAxes();
                    var newVal = getAxes.xaxis.c2p(e.originalEvent.touches[0].clientX);
                    var oldValinNewWindow = getAxes.xaxis.c2p(previousXPosition);

                    var existingChartGetAxes = existingChartRef.getAxes();
                    var difference = newVal - oldValinNewWindow;
                    var base = (existingChartGetAxes.xaxis.max + existingChartGetAxes.xaxis.min) / 2;
                    var timePerDivision = (existingChartGetAxes.xaxis.max - existingChartGetAxes.xaxis.min) / 10;
                    var newPos = base + difference;
                    var min = newPos - timePerDivision * 5;
                    var max = newPos + timePerDivision * 5;
                    existingChartGetAxes.xaxis.options.min = min;
                    existingChartGetAxes.xaxis.options.max = max;
                    if (isNaN(min) || isNaN(max)) { return; }
                    existingChartRef.setupGrid();
                    existingChartRef.draw();
                    var infoContainer = {
                        x: e.originalEvent.touches[0].clientX,
                        y: e.originalEvent.touches[0].clientY,
                        min: min,
                        max: max,
                        mid: newPos,
                        axisNum: 1,
                        axis: 'xaxis'
                    };
                    plot.getPlaceholder().trigger('timelinePanEvent', [infoContainer]);
                    previousXPosition = e.originalEvent.touches[0].clientX;
                    plot.updateTimelineCurtains(infoContainer);

                }
            }

            function timelineTouchEnd(e) {
                plot.getPlaceholder().unbind('touchmove', timelineTouchMove);
            }

            function timelineMouseUp(e) {
                plot.getPlaceholder().unbind('mousemove', horPanTimeline);

            }

            function timelineMouseWheel(e, delta) {
                if (delta < 0 && startingXIndex < secsPerDivisionValues.length - 1) {
                    startingXIndex++;
                    timelineMouseWheelRedraw();
                }
                else if (delta > 0 && startingXIndex > 0) {
                    startingXIndex--;
                    timelineMouseWheelRedraw();
                }

            }

            function addCurtains() {
                plot.addCursor({
                    name: 'curtain-1',
                    mode: 'x',
                    color: 'rgba(182, 191, 190, 0.5)',
                    lineWidth: 10,
                    position: {
                        relativeX: 0,
                        relativeY: 0
                    },
                    show: true,
                    fullHeight: true,
                    symbol: 'none',
                    showLabel: false,
                    movable: false,
                    showIntersections: false,
                });
                plot.addCursor({
                    name: 'curtain-2',
                    mode: 'x',
                    color: 'rgba(182, 191, 190, 0.5)',
                    lineWidth: 10,
                    position: {
                        relativeX: 1,
                        relativeY: 1
                    },
                    show: true,
                    fullHeight: true,
                    symbol: 'none',
                    showLabel: false,
                    movable: false,
                    showIntersections: false,
                });
                plot.addCursor({
                    name: 'band-1',
                    mode: 'x',
                    color: 'rgba(182, 191, 190, 0.5)',
                    lineWidth: 20,
                    position: {
                        relativeX: 0,
                        relativeY: 0
                    },
                    show: true,
                    fullHeight: true,
                    symbol: 'none',
                    showLabel: false,
                    movable: false,
                    showIntersections: false,
                });
                plot.addCursor({
                    name: 'band-2',
                    mode: 'x',
                    color: 'rgba(182, 191, 190, 0.5)',
                    lineWidth: 20,
                    position: {
                        relativeX: 1,
                        relativeY: 1
                    },
                    show: true,
                    fullHeight: true,
                    symbol: 'none',
                    showLabel: false,
                    movable: false,
                    showIntersections: false,
                });
            }

            function timelineMouseWheelRedraw() {
                //Move cursors (curtains and such)
                //code here

                //Update existingChart if enabled
                if (updateExistingChart) {
                    if (existingChartRef == null) { return; }

                    existingChartRef.setActiveXIndex(startingXIndex);
                    getAxes = existingChartRef.getAxes();
                    var base = (getAxes.xaxis.max + getAxes.xaxis.min) / 2;
                    var min = base - secsPerDivisionValues[startingXIndex] * 5;
                    var max = base + secsPerDivisionValues[startingXIndex] * 5;
                    getAxes.xaxis.options.min = min;
                    getAxes.xaxis.options.max = max;
                    plot.getPlaceholder().trigger('timelineWheelRedraw', [{
                        min: min,
                        max: max,
                        mid: base,
                        perDivVal: secsPerDivisionValues[startingXIndex],
                        perDivArrayIndex: startingXIndex,
                        axisNum: 1,
                        axis: 'xaxis'
                    }]);


                    existingChartRef.setupGrid();
                    existingChartRef.draw();

                    plot.updateTimelineCurtains({
                        min: min,
                        max: max
                    });
                }
            }

            function horPanTimeline(e) {

                //update existing chart if enabled
                if (updateExistingChart) {
                    if (existingChartRef == null) { return; }

                    var getAxes = plot.getAxes();
                    var newVal = getAxes.xaxis.c2p(e.clientX);
                    var oldValinNewWindow = getAxes.xaxis.c2p(previousXPosition);

                    var existingChartGetAxes = existingChartRef.getAxes();
                    var difference = newVal - oldValinNewWindow;
                    var base = (existingChartGetAxes.xaxis.max + existingChartGetAxes.xaxis.min) / 2;
                    var timePerDivision = (existingChartGetAxes.xaxis.max - existingChartGetAxes.xaxis.min) / 10;
                    var newPos = base + difference;
                    var min = newPos - timePerDivision * 5;
                    var max = newPos + timePerDivision * 5;
                    existingChartGetAxes.xaxis.options.min = min;
                    existingChartGetAxes.xaxis.options.max = max;
                    existingChartRef.setupGrid();
                    existingChartRef.draw();
                    var infoContainer = {
                        x: e.clientX,
                        y: e.clientY,
                        min: min,
                        max: max,
                        mid: newPos,
                        axisNum: 1,
                        axis: 'xaxis'
                    };
                    plot.getPlaceholder().trigger('timelinePanEvent', [infoContainer]);
                    previousXPosition = e.clientX;
                    plot.updateTimelineCurtains(infoContainer);

                }
            }

            function timelineResize() {
                if (updateExistingChart && existingChartRef != null) {
                    var getAxes = existingChartRef.getAxes();
                    plot.updateTimelineCurtains({
                        min: getAxes.xaxis.min,
                        max: getAxes.xaxis.max
                    });
                }
            }

            /**************************************************************
            * Bind Events
            **************************************************************/
            plot.hooks.bindEvents.push(function (plot, eventHolder) {
                eventHolder.mousedown(timelineMouseDown);
                eventHolder.mouseup(timelineMouseUp);
                eventHolder.mouseout(timelineMouseUp);
                eventHolder.mousewheel(timelineMouseWheel);
                eventHolder.bind('touchstart', timelineTouchDown);
                eventHolder.bind('touchend', timelineTouchEnd);
                eventHolder.resize(timelineResize);
            });

            /**************************************************************
            * Unbind Events
            **************************************************************/
            plot.hooks.shutdown.push(function (plot, eventHolder) {
                eventHolder.unbind('mousedown', timelineMouseDown);
                eventHolder.unbind('mouseup', timelineMouseUp);
                eventHolder.unbind('mouseout', timelineMouseUp);
                eventHolder.unbind('mousewheel', timelineMouseWheel);
                eventHolder.unbind('timelinePanEvent');
                eventHolder.unbind('timelineWheelRedraw');
                eventHolder.unbind('touchstart', timelineTouchDown);
                eventHolder.unbind('touchend', timelineTouchEnd);
                eventHolder.unbind('resize', timelineResize);
            });
        }
    }
    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'timelineChart',
        version: '0.1'
    });
})(jQuery);
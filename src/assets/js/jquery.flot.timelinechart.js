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

                //Read values. Options will be default defined above unless specified by developer
                secsPerDivisionValues = options.timelineChart.secsPerDivisionValues;
                startingXIndex = options.timelineChart.startingXIndex;
                existingChartRef = options.timelineChart.existingChartRef;
                updateExistingChart = options.timelineChart.updateExistingChart;

                console.log(options);

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

            /**************************************************************
            * Event Functions
            **************************************************************/
            function timelineMouseDown(e) {

                previousXPosition = e.clientX;
                previousYPosition = e.clientY;

                plot.getPlaceholder().bind('mousemove', horPanTimeline);
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

            function timelineMouseWheelRedraw() {
                //Move cursors (curtains and such)
                //code here

                //Update existingChart if enabled
                if (updateExistingChart) {
                    if (existingChartRef == null) { return; }

                    var getAxes = existingChartRef.getAxes();
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


                    plot.setupGrid();
                    plot.draw();
                }
            }

            function horPanTimeline(e) {

                //Move cursors
                //code here

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
                    plot.getPlaceholder().trigger('timelinePanEvent', [
                        {
                            x: e.clientX,
                            y: e.clientY,
                            min: min,
                            max: max,
                            mid: newPos,
                            axisNum: 1,
                            axis: 'xaxis'
                        }
                    ]);
                    previousXPosition = e.clientX;
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
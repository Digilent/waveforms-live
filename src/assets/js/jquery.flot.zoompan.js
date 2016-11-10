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
(function(d) { function e(a) { var b = a || window.event, c = [].slice.call(arguments, 1), f = 0, e = 0, g = 0, a = d.event.fix(b); a.type = "mousewheel"; b.wheelDelta && (f = b.wheelDelta / 120); b.detail && (f = -b.detail / 3); g = f; void 0 !== b.axis && b.axis === b.HORIZONTAL_AXIS && (g = 0, e = -1 * f); void 0 !== b.wheelDeltaY && (g = b.wheelDeltaY / 120); void 0 !== b.wheelDeltaX && (e = -1 * b.wheelDeltaX / 120); c.unshift(a, f, e, g); return (d.event.dispatch || d.event.handle).apply(this, c) } var c = ["DOMMouseScroll", "mousewheel"]; if (d.event.fixHooks) for (var h = c.length; h;)d.event.fixHooks[c[--h]] = d.event.mouseHooks; d.event.special.mousewheel = { setup: function() { if (this.addEventListener) for (var a = c.length; a;)this.addEventListener(c[--a], e, !1); else this.onmousewheel = e }, teardown: function() { if (this.removeEventListener) for (var a = c.length; a;)this.removeEventListener(c[--a], e, !1); else this.onmousewheel = null } }; d.fn.extend({ mousewheel: function(a) { return a ? this.bind("mousewheel", a) : this.trigger("mousewheel") }, unmousewheel: function(a) { return this.unbind("mousewheel", a) } }) })(jQuery);

(function($) {
    var options = {
        zoomPan: {
            enabled: false,
            secsPerDivisionValues: [0.000000001, 0.000000002, 0.000000005, 0.00000001, 0.00000002, 0.00000005, 0.0000001, 0.0000002,
                0.0000005, 0.000001, 0.000002, 0.000005, 0.00001, 0.00002, 0.00005, 0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.005, 0.01,
                0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10],
            startingXIndex: 0,

            startingYIndexArray: [0, 0],
            selectedYAxis: 1,
            voltsPerDivisionValues: [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
        }
    };

    //Internal variables
    var previousXPosition;
    var previousYPosition;
    var panType;
    var wheelZoomX;

    //Variables exposed in options
    var selectedYAxis;
    var secsPerDivisionValues;
    var voltsPerDivisionValues;
    var startingXIndex;
    var startingYIndexArray;

    function init(plot) {

        /**************************************************************
        * Process Options
        **************************************************************/
        plot.hooks.processOptions.push(function(plot, options) {
            if (options.zoomPan.enabled) {
                console.log('zoom pan plugin enabled');

                //Setup Chart
                setupChart(plot);

                //Read values. Options will be default defined above unless specified by developer
                selectedYAxis = options.zoomPan.selectedYAxis;
                secsPerDivisionValues = options.zoomPan.secsPerDivisionValues;
                voltsPerDivisionValues = options.zoomPan.voltsPerDivisionValues;
                startingXIndex = options.zoomPan.startingXIndex;
                startingYIndexArray = options.zoomPan.startingYIndexArray;
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

            /**************************************************************
            * Event Functions
            **************************************************************/
            function chartMouseDown(e) {
                plot.getPlaceholder().trigger('panEvent', ['mousedown']);

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
                console.log(panType);
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
                if (wheelZoomX) {
                    var base = (getAxes.xaxis.max + getAxes.xaxis.min) / 2;
                    var min = base - secsPerDivisionValues[startingXIndex] * 5;
                    var max = base + secsPerDivisionValues[startingXIndex] * 5;
                    getAxes.xaxis.options.min = min;
                    getAxes.xaxis.options.max = max;
                    plot.getPlaceholder().trigger('mouseWheelRedraw', [{
                        min: min,
                        max: max,
                        mid: base,
                        perDivVal: secsPerDivisionValues[startingXIndex],
                        perDivArrayIndex: startingXIndex,
                        axisNum: 1,
                        axis: 'xaxis'
                    }]);
                }
                else {
                    var yaxisIndexer = 'y' + (selectedYAxis === 1 ? '' : selectedYAxis.toString()) + 'axis';
                    var base = (getAxes[yaxisIndexer].max + getAxes[yaxisIndexer].min) / 2;
                    var min = base - voltsPerDivisionValues[startingYIndexArray[selectedYAxis - 1]] * 5;
                    var max = base + voltsPerDivisionValues[startingYIndexArray[selectedYAxis - 1]] * 5;
                    getAxes[yaxisIndexer].options.min = min;
                    getAxes[yaxisIndexer].options.max = max;
                    plot.getPlaceholder().trigger('mouseWheelRedraw', [{
                        min: min,
                        max: max,
                        mid: base,
                        perDivVal: voltsPerDivisionValues[startingYIndexArray[selectedYAxis - 1]],
                        perDivArrayIndex: startingYIndexArray[selectedYAxis - 1],
                        axisNum: selectedYAxis,
                        axis: yaxisIndexer
                    }]);
                }

                plot.setupGrid();
                plot.draw();
            }

            function vertPanChart(e) {
                var yaxisIndexer = 'y' + (selectedYAxis === 1 ? '' : selectedYAxis.toString()) + 'axis';
                var getAxes = plot.getAxes();
                var newVal = getAxes.yaxis.c2p(e.clientY);
                var oldValinNewWindow = getAxes.yaxis.c2p(previousYPosition);
                var difference = newVal - oldValinNewWindow;
                var base = (getAxes.yaxis.max + getAxes.yaxis.min) / 2;
                var voltsPerDivision = (getAxes.yaxis.max - getAxes.yaxis.min) / 10;
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
                plot.getPlaceholder().trigger('panEvent', [
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

            /**************************************************************
            * Bind Events
            **************************************************************/
            plot.hooks.bindEvents.push(function(plot, eventHolder) {
                eventHolder.mousedown(chartMouseDown);
                eventHolder.mouseup(chartMouseUp);
                eventHolder.mouseout(chartMouseUp);
                eventHolder.mousewheel(mouseWheel);
            });

            /**************************************************************
            * Unbind Events
            **************************************************************/
            plot.hooks.shutdown.push(function(plot, eventHolder) {
                eventHolder.unbind('mousedown', chartMouseDown);
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
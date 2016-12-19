/* Flot plugin for adding cursors to the plot.

Copyright (c) cipix2000@gmail.com.
Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.
*/

/*global jQuery*/

(function ($) {
    'use strict';

    var options = {
        cursors: []
    };

    var constants = {
        iRectSize: 8,
        symbolSize: 8,
        mouseGrabMargin: 8,
        textHeight: 10, // to do: compute it somehow. Canvas doesn't give us a way to know it
        labelPadding: 10
    };

    // The possible locations for a cursor label
    var cursorLabelLocationEnum = Object.freeze({
        // This is the only label for a cursor
        ONLY: 'only',
        // There are two cursor labels and this is the top one
        TOP: 'top',
        // There are two cursor labels and this is the bottom one
        BOTTOM: 'bottom'
    });

    function init(plot) {
        var cursors = [];
        var update = [];

        function createCursor(options) {
            return mixin(options, {
                name: options.name || ('unnamed ' + cursors.length),
                position: options.position || {
                    relativeX: 0.5,
                    relativeY: 0.5
                },
                x: 0,
                y: 0,
                show: true,
                selected: false,
                highlighted: false,
                mode: 'xy',
                showIntersections: false,
                showLabel: false,
                showValuesRelativeToSeries: undefined,
                color: 'gray',
                fontSize: '10px',
                fontFamily: 'sans-serif',
                fontStyle: '',
                fontWeight: '',
                lineWidth: 1,
                movable: true,
                fullHeight: false,
                drawAnchor: false,
                mouseButton: 'all',
                dashes: 1,
                intersectionColor: 'darkgray',
                intersectionLabelPosition: 'bottom-right'
            });
        }

        plot.hooks.processOptions.push(function (plot) {

            plot.getOptions().cursors.forEach(function (options) {
                plot.addCursor(options);
            });
        });

        plot.getCursors = function () {
            return cursors;
        };

        plot.addCursor = function addCursor(options) {
            var currentCursor = createCursor(options);

            setPosition(plot, currentCursor, options.position);
            cursors.push(currentCursor);

            plot.triggerRedrawOverlay();
        };

        plot.removeCursor = function removeCursor(cursor) {
            var index = cursors.indexOf(cursor);

            if (index !== -1) {
                cursors.splice(index, 1);
            }

            plot.triggerRedrawOverlay();
        };

        plot.setCursor = function setCursor(cursor, options) {
            var index = cursors.indexOf(cursor);

            if (index !== -1) {
                mixin(options, cursors[index]);
                setPosition(plot, cursors[index], cursors[index].position);
                plot.triggerRedrawOverlay();
            }
        };

        plot.setMultipleCursors = function setMultipleCursors(cursorArray, optionsArray) {
            if (cursorArray.length !== optionsArray.length) { return; }

            for (var i = 0; i < cursorArray.length; i++) {
                var index = cursors.indexOf(cursorArray[i]);
                if (index !== -1) {
                    mixin(optionsArray[i], cursors[index]);
                    setPosition(plot, cursors[index], cursors[index].position);
                }
            }
            plot.triggerRedrawOverlay();
        }

        plot.getIntersections = function getIntersections(cursor) {
            var index = cursors.indexOf(cursor);

            if (index !== -1) {
                return cursors[index].intersections;
            }

            return [];
        };

        function onMouseOut(e) {
            onMouseUp(e);
        }

        function onTouchOut(e) {
            onTouchUp(e);
        }

        var selectedCursor = function (cursors) {
            var result;

            cursors.forEach(function (cursor) {
                if (cursor.selected) {
                    if (!result)
                        result = cursor;
                }
            });

            return result;
        };

        var selectCursor = function (cursors, cursor) {
            cursors.forEach(function (c) {
                if (c === cursor) {
                    c.selected = true;
                } else {
                    c.selected = false;
                }
            });
        };

        var visibleCursors = function (cursors) {
            return cursors.filter(function (cursor) {
                return cursor.show;
            });
        };

        // possible issues with ie8
        var correctMouseButton = function (cursor, buttonNumber) {
            switch (cursor.mouseButton) {
                case 'all':
                    return true;
                case 'left':
                    return buttonNumber === 0;
                case 'middle':
                    return buttonNumber === 1;
                case 'right':
                    return buttonNumber === 2;
                default:
                    return true;
            }
        };

        function onTouchDown(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.originalEvent.touches[0].pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.originalEvent.touches[0].pageY - offset.top, plot.height()));

            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                // unselect the cursor and move it to the current position
                currentlySelectedCursor.selected = false;
                plot.getPlaceholder().css('cursor', 'default');
                currentlySelectedCursor.x = mouseX;
                currentlySelectedCursor.y = mouseY;
                currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();

                plot.triggerRedrawOverlay();
            } else {
                // find nearby cursor and unlock it
                var targetCursor;
                var dragmode;

                visibleCursors(cursors).forEach(function (cursor) {
                    if (!cursor.movable) {
                        return;
                    }
                    if (mouseOverCursorHorizontalLine(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'y';
                    }
                    if (mouseOverCursorVerticalLine(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'x';
                    }
                    if (mouseOverCursorManipulator(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'xy';
                    }
                });

                if (targetCursor) {
                    if (!correctMouseButton(targetCursor, e.button)) {
                        return;
                    }
                    targetCursor.selected = true;
                    targetCursor.dragmode = dragmode;
                    // changed for InsightCM -max
                    if (targetCursor.mode === 'x') {
                        plot.getPlaceholder().css('cursor', 'ew-resize');
                    } else if (targetCursor.mode === 'y') {
                        plot.getPlaceholder().css('cursor', 'ns-resize');
                    } else {
                        plot.getPlaceholder().css('cursor', 'move');
                    }
                    plot.getPlaceholder().css('cursor', 'move');
                    plot.triggerRedrawOverlay();
                    e.stopPropagation();
                }
            }
        }

        function onMouseDown(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                // unselect the cursor and move it to the current position
                currentlySelectedCursor.selected = false;
                plot.getPlaceholder().css('cursor', 'default');
                currentlySelectedCursor.x = mouseX;
                currentlySelectedCursor.y = mouseY;
                currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();

                plot.triggerRedrawOverlay();
            } else {
                // find nearby cursor and unlock it
                var targetCursor;
                var dragmode;

                visibleCursors(cursors).forEach(function (cursor) {
                    if (!cursor.movable) {
                        return;
                    }
                    if (mouseOverCursorHorizontalLine(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'y';
                    }
                    if (mouseOverCursorVerticalLine(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'x';
                    }
                    if (mouseOverCursorManipulator(e, plot, cursor)) {
                        targetCursor = cursor;
                        dragmode = 'xy';
                    }
                });

                if (targetCursor) {
                    if (!correctMouseButton(targetCursor, e.button)) {
                        return;
                    }
                    targetCursor.selected = true;
                    targetCursor.dragmode = dragmode;
                    // changed for InsightCM -max
                    if (targetCursor.mode === 'x') {
                        plot.getPlaceholder().css('cursor', 'ew-resize');
                    } else if (targetCursor.mode === 'y') {
                        plot.getPlaceholder().css('cursor', 'ns-resize');
                    } else {
                        plot.getPlaceholder().css('cursor', 'move');
                    }
                    plot.getPlaceholder().css('cursor', 'move');
                    plot.triggerRedrawOverlay();
                    e.stopPropagation();
                }
            }
        }

        function onTouchUp(e) {
            var offset = plot.offset();
            console.log(e);
            var mouseX = Math.max(0, Math.min(e.originalEvent.touches[0].pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.originalEvent.touches[0].pageY - offset.top, plot.height()));
            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                if (!correctMouseButton(currentlySelectedCursor, e.button)) {
                    return;
                }
                // lock the free cursor to current position
                currentlySelectedCursor.selected = false;
                if (currentlySelectedCursor.dragmode.indexOf('x') !== -1) {
                    currentlySelectedCursor.x = mouseX;
                    currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                }

                if (currentlySelectedCursor.dragmode.indexOf('y') !== -1) {
                    currentlySelectedCursor.y = mouseY;
                    currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();
                }

                plot.getPlaceholder().css('cursor', 'default');
                plot.triggerRedrawOverlay();
            }
        }

        function onMouseUp(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));
            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                if (!correctMouseButton(currentlySelectedCursor, e.button)) {
                    return;
                }
                // lock the free cursor to current position
                currentlySelectedCursor.selected = false;
                if (currentlySelectedCursor.dragmode.indexOf('x') !== -1) {
                    currentlySelectedCursor.x = mouseX;
                    currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                }

                if (currentlySelectedCursor.dragmode.indexOf('y') !== -1) {
                    currentlySelectedCursor.y = mouseY;
                    currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();
                }

                plot.getPlaceholder().css('cursor', 'default');
                plot.triggerRedrawOverlay();
            }
        }

        function onTouchMove(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.originalEvent.touches[0].pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.originalEvent.touches[0].pageY - offset.top, plot.height()));

            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                if (currentlySelectedCursor.dragmode.indexOf('x') !== -1) {
                    currentlySelectedCursor.x = mouseX;
                    currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                }

                if (currentlySelectedCursor.dragmode.indexOf('y') !== -1) {
                    currentlySelectedCursor.y = mouseY;
                    currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();
                }

                plot.triggerRedrawOverlay();
                e.stopPropagation();
            } else {
                visibleCursors(cursors).forEach(function (cursor) {
                    if (!cursor.movable) {
                        return;
                    }
                    if (mouseOverCursorManipulator(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'pointer');
                    } else if (mouseOverCursorVerticalLine(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'col-resize');
                    } else if (mouseOverCursorHorizontalLine(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'row-resize');
                    } else {
                        if (cursor.highlighted) {
                            cursor.highlighted = false;
                            plot.getPlaceholder().css('cursor', 'default');
                            plot.triggerRedrawOverlay();
                        }
                    }
                });
            }
        }

        function onMouseMove(e) {
            var offset = plot.offset();
            var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
            var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));

            var currentlySelectedCursor = selectedCursor(cursors);

            if (currentlySelectedCursor) {
                if (currentlySelectedCursor.dragmode.indexOf('x') !== -1) {
                    currentlySelectedCursor.x = mouseX;
                    currentlySelectedCursor.position.relativeX = currentlySelectedCursor.x / plot.width();
                }

                if (currentlySelectedCursor.dragmode.indexOf('y') !== -1) {
                    currentlySelectedCursor.y = mouseY;
                    currentlySelectedCursor.position.relativeY = currentlySelectedCursor.y / plot.height();
                }

                plot.triggerRedrawOverlay();
                e.stopPropagation();
            } else {
                visibleCursors(cursors).forEach(function (cursor) {
                    if (!cursor.movable) {
                        return;
                    }
                    if (mouseOverCursorManipulator(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'pointer');
                    } else if (mouseOverCursorVerticalLine(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'col-resize');
                    } else if (mouseOverCursorHorizontalLine(e, plot, cursor)) {
                        if (!cursor.highlighted) {
                            cursor.highlighted = true;
                            plot.triggerRedrawOverlay();
                        }

                        plot.getPlaceholder().css('cursor', 'row-resize');
                    } else {
                        if (cursor.highlighted) {
                            cursor.highlighted = false;
                            plot.getPlaceholder().css('cursor', 'default');
                            plot.triggerRedrawOverlay();
                        }
                    }
                });
            }
        }

        plot.hooks.bindEvents.push(function (plot, eventHolder) {
            eventHolder.mousedown(onMouseDown);
            eventHolder.mouseup(onMouseUp);
            eventHolder.mouseout(onMouseOut);
            eventHolder.mousemove(onMouseMove);

            //Touch Events
            eventHolder.bind('touchstart', dummy);
            eventHolder.bind('touchmove', dummy);
            eventHolder.bind('touchleave', dummy);
            eventHolder.bind('touchend', dummy);
        });

        function findIntersections(plot, cursor) {
            var pos = plot.c2p({
                left: cursor.x,
                top: cursor.y
            });

            var intersections = {
                cursor: cursor.name,
                x: pos.x,
                y: pos.y,
                points: []
            };

            var axes = plot.getAxes();
            if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
                pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
                return intersections;
            }

            var i, j, dataset = plot.getData();

            for (i = 0; i < dataset.length; ++i) {
                var series = dataset[i];

                // Find the nearest points, x-wise
                for (j = 0; j < series.data.length; ++j) {
                    if (series.data[j] && series.data[j][0] > pos.x) {
                        break;
                    }
                }

                // Now Interpolate
                var y,
                    p1 = series.data[j - 1],
                    p2 = series.data[j];

                if ((p1 === undefined) || (p2 === undefined)) {
                    continue;
                }

                y = p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]);

                pos.y = y;
                pos.y1 = y;

                intersections.points.push({
                    x: pos.x,
                    y: pos.y,
                    leftPoint: p1,
                    rightPoint: p2
                });
            }

            return intersections;
        }

        plot.hooks.drawOverlay.push(function (plot, ctx) {
            update = [];

            cursors.forEach(function (cursor) {
                var intersections;

                setPosition(plot, cursor, cursor.position);
                intersections = findIntersections(plot, cursor);
                maybeSnapToPlot(plot, cursor, intersections);
                cursor.intersections = intersections;
                intersections.target = cursor;
                update.push(intersections);

                if (cursor.show) {
                    var plotOffset = plot.getPlotOffset();

                    ctx.save();
                    if (!cursor.fullHeight) {
                        ctx.translate(plotOffset.left, plotOffset.top);
                    }
                    else {
                        ctx.translate(plotOffset.left, 0);
                    }

                    drawVerticalAndHorizontalLines(plot, ctx, cursor);
                    drawLabel(plot, ctx, cursor);
                    drawIntersections(plot, ctx, cursor);
                    drawValues(plot, ctx, cursor);
                    if (cursor.symbol !== 'none') {
                        drawManipulator(plot, ctx, cursor);
                    }

                    ctx.restore();
                }
            });

            plot.getPlaceholder().trigger('cursorupdates', [update]);
        });

        plot.hooks.shutdown.push(function (plot, eventHolder) {
            eventHolder.unbind('mousedown', onMouseDown);
            eventHolder.unbind('mouseup', onMouseUp);
            eventHolder.unbind('mouseout', onMouseOut);
            eventHolder.unbind('mousemove', onMouseMove);
            eventHolder.unbind('cursorupdates');
            //Touch Events
            eventHolder.unbind('touchstart', dummy);
            eventHolder.unbind('touchend', dummy);
            eventHolder.unbind('touchleave', dummy);
            eventHolder.unbind('touchmove', dummy);
            plot.getPlaceholder().css('cursor', 'default');
        });
    }

    function dummy(e) {

    }

    function mixin(source, destination) {
        Object.keys(source).forEach(function (key) {
            destination[key] = source[key];
        });

        return destination;
    }

    function setPosition(plot, cursor, pos) {
        var o;
        if (!pos)
            return;

        o = plot.p2c(pos);
        var rx = pos.relativeX * plot.width();
        var ry = pos.relativeY * plot.height();

        if ((pos.relativeX !== undefined)) {
            cursor.x = Math.max(0, Math.min(rx, plot.width()));
            if (pos.relativeY === undefined) {
                cursor.y = Math.max(0, Math.min(o.top, plot.height()));
            } else {
                cursor.y = Math.max(0, Math.min(ry, plot.height()));
            }
        } else if (pos.relativeY !== undefined) {
            cursor.x = Math.max(0, Math.min(o.left, plot.width()));
            cursor.y = Math.max(0, Math.min(ry), plot.height());
        } else {
            cursor.x = Math.max(0, Math.min(o.left, plot.width()));
            cursor.y = Math.max(0, Math.min(o.top, plot.height()));
        }
    }

    function maybeSnapToPlot(plot, cursor, intersections) {
        if (cursor.snapToPlot !== undefined) {
            var point = intersections.points[cursor.snapToPlot];
            if (point) {
                setPosition(plot, cursor, {
                    x: point.x,
                    y: point.y
                });

                intersections.y = point.y; // update cursor position
            }
        }
    }

	/**
	 * The text displayed next to the cursor can be stacked as rows and their positions can be calculated with this function.
	 * The bottom one has the index = 0, and the top one has the index = count -1. Depending on the current cursor's possition
	 * relative to the center of the plot, index and count, the positions will be computed like this:
	 *
	 *               |
	 *           two | two
	 *           one | one
	 *          zero | zero
	 *       --------+--------
	 *           two | two
	 *           one | one
	 *          zero | zero
	 *               |
	 */
    function computeRowPosition(plot, cursor, index, count) {
        var width = plot.width();
        var height = plot.height();
        var textAlign = 'left';
        var fontSizeInPx = Number(cursor.fontSize.substring(0, cursor.fontSize.length - 2));

        var y = cursor.y;
        var x = cursor.x;

        if (x > (width / 2)) {
            x -= constants.labelPadding;
            textAlign = 'right';
        } else {
            x += constants.labelPadding;
        }

        if (y > (height / 2)) {
            y -= constants.labelPadding * (count - index) + fontSizeInPx * (count - 1 - index);
        } else {
            y += constants.labelPadding * (index + 1) + fontSizeInPx * (index + 1);
        }

        return {
            x: x,
            y: y,
            textAlign: textAlign
        };
    }

    function rowCount(cursor) {
        return (typeof cursor.showValuesRelativeToSeries === 'number' ? 1 : 0) + (cursor.showLabel ? 1 : 0);
    }

    function labelRowIndex(cursor) {
        return 0;
    }

    function valuesRowIndex(cursor) {
        return cursor.showLabel ? 1 : 0;
    }

    function drawLabel(plot, ctx, cursor) {
        if (cursor.showLabel) {
            ctx.beginPath();
            var fontSizeInPx = Number(cursor.fontSize.substring(0, cursor.fontSize.length - 2));
            var position = computeRowPosition(plot, cursor, labelRowIndex(cursor), rowCount(cursor));
            ctx.fillStyle = cursor.color;
            ctx.textAlign = position.textAlign;
            ctx.font = cursor.fontStyle + ' ' + cursor.fontWeight + ' ' + cursor.fontSize + ' ' + cursor.fontFamily;
            ctx.fillText(cursor.name, position.x, position.y);
            ctx.textAlign = 'left';
            ctx.stroke();
        }
    }

    function fillTextAligned(ctx, text, x, y, position, fontStyle, fontWeight, fontSize, fontFamily) {
        var fontSizeInPx = Number(fontSize.substring(0, fontSize.length - 2));
        switch (position) {
            case 'left':
                var textWidth = ctx.measureText(text).width;
                x = x - textWidth - constants.iRectSize;
                y = y;
                break;
            case 'bottom-left':
                var textWidth = ctx.measureText(text).width;
                x = x - textWidth - constants.iRectSize;
                y = y + fontSizeInPx;
                break;
            case 'top-left':
                var textWidth = ctx.measureText(text).width;
                x = x - textWidth - constants.iRectSize;
                y = y - constants.iRectSize;
                break;
            case 'top-right':
                x = x + constants.iRectSize;
                y = y - constants.iRectSize;
                break;
            case 'right':
                x = x + constants.iRectSize;
                y = y;
                break;
            case 'bottom-right':
            default:
                x = x + constants.iRectSize;
                y = y + fontSizeInPx;
                break;
        }

        ctx.textBaseline = "middle";
        ctx.font = fontStyle + ' ' + fontWeight + ' ' + fontSize + ' ' + fontFamily;
        ctx.fillText(text, x, y);

    }

    function drawIntersections(plot, ctx, cursor) {
        if (cursor.showIntersections && hasVerticalLine(cursor)) {
            ctx.beginPath();
            if (cursor.intersections === undefined) {
                return;
            }
            cursor.intersections.points.forEach(function (point, index) {
                if (typeof cursor.showIntersections === 'object') {
                    if (cursor.showIntersections.indexOf(index) === -1) {
                        return;
                    }
                }
                var coord = plot.p2c(point);
                ctx.fillStyle = cursor.intersectionColor;
                ctx.fillRect(Math.floor(coord.left) - constants.iRectSize / 2,
                    Math.floor(coord.top) - constants.iRectSize / 2,
                    constants.iRectSize, constants.iRectSize);

                var text;
                if (typeof cursor.formatIntersectionData === 'function') {
                    text = cursor.formatIntersectionData(point);
                } else {
                    text = point.y.toFixed(2);
                }

                fillTextAligned(ctx, text, coord.left, coord.top, cursor.intersectionLabelPosition, cursor.fontStyle, cursor.fontWeight, cursor.fontSize, cursor.fontFamily);
            });
            ctx.stroke();
        }
    }

    function drawValues(plot, ctx, cursor) {
        if (typeof cursor.showValuesRelativeToSeries === 'number') {
            ctx.beginPath();
            var dataset = plot.getData();

            var series = dataset[cursor.showValuesRelativeToSeries];
            var xaxis = series.xaxis;
            var yaxis = series.yaxis;

            var text = '' + xaxis.c2p(cursor.x).toFixed(2) + ', ' + yaxis.c2p(cursor.y).toFixed(2);

            var position = computeRowPosition(plot, cursor, valuesRowIndex(cursor), rowCount(cursor));

            ctx.fillStyle = cursor.color;
            ctx.textAlign = position.textAlign;
            ctx.font = cursor.fontStyle + ' ' + cursor.fontWeight + ' ' + cursor.fontSize + ' ' + cursor.fontFamily;
            ctx.fillText(text, position.x, position.y);

            ctx.textAlign = 'left';

            ctx.stroke();
        }
    }

    function drawVerticalAndHorizontalLines(plot, ctx, cursor) {
        // abort draw if linewidth is zero
        var canvasHeight = plot.height();
        if (cursor.lineWidth === 0) {
            return;
        }
        if (cursor.fullHeight) {
            var canvasRef = plot.getCanvas();
            canvasHeight = canvasRef.height;
        }
        // keep line sharp
        var adj = cursor.lineWidth % 2 ? 0.5 : 0;

        ctx.strokeStyle = cursor.color;
        ctx.lineWidth = cursor.lineWidth;
        ctx.lineJoin = "round";

        ctx.beginPath();

        if (cursor.mode.indexOf("x") !== -1) {
            var drawX = Math.floor(cursor.x) + adj;
            if (cursor.dashes <= 0) {
                ctx.moveTo(drawX, 0);
                ctx.lineTo(drawX, canvasHeight);
            } else {
                var numberOfSegments = cursor.dashes * 2 - 1;
                var delta = canvasHeight / numberOfSegments;
                for (var i = 0; i < numberOfSegments; i += 2) {
                    ctx.moveTo(drawX, delta * i);
                    ctx.lineTo(drawX, delta * (i + 1));
                }
            }
        }

        if (cursor.mode.indexOf("y") !== -1) {
            var drawY = Math.floor(cursor.y) + adj;
            if (cursor.dashes <= 0) {
                ctx.moveTo(0, drawY);
                ctx.lineTo(plot.width(), drawY);
            } else {
                var numberOfSegments = cursor.dashes * 2 - 1;
                var delta = plot.width() / numberOfSegments;
                for (var i = 0; i < numberOfSegments; i += 2) {
                    ctx.moveTo(delta * i, drawY);
                    ctx.lineTo(delta * (i + 1), drawY);
                }
            }
        }

        ctx.stroke();
        if (cursor.drawAnchor) {
            drawAnchor(plot, ctx, cursor);
        }
    }

    function drawAnchor(plot, ctx, cursor) {
        var canvasHeight = plot.height();
        if (cursor.lineWidth === 0) {
            return;
        }
        if (cursor.fullHeight) {
            var canvasRef = plot.getCanvas();
            canvasHeight = canvasRef.height;
        }

        ctx.strokeStyle = cursor.color;
        ctx.lineWidth = 1;

        ctx.beginPath();

        if (cursor.mode.indexOf("x") !== -1) {
            var drawX = Math.floor(cursor.x);
            ctx.moveTo(drawX, 0);
            ctx.lineTo(drawX + 5, -10);
            ctx.lineTo(drawX - 5, -10);
            ctx.closePath();
        }

        if (cursor.mode.indexOf("y") !== -1 && cursor.mode !== "xy") {
            var drawY = Math.floor(cursor.y);
            ctx.moveTo(0, drawY);
            ctx.lineTo(-10, drawY - 5);
            ctx.lineTo(-10, drawY + 5);
            ctx.closePath();
        }
        ctx.stroke();
    }

    function drawManipulator(plot, ctx, cursor) {
        // keep line sharp
        var adj = cursor.lineWidth % 2 ? 0.5 : 0;
        ctx.beginPath();

        if (cursor.highlighted)
            ctx.strokeStyle = 'orange';
        else
            ctx.strokeStyle = cursor.color;
        if (cursor.symbol && plot.drawSymbol && plot.drawSymbol[cursor.symbol]) {
            //first draw a white background
            ctx.fillStyle = 'white';
            ctx.fillRect(Math.floor(cursor.x) + adj - (constants.symbolSize / 2 + 1),
                Math.floor(cursor.y) + adj - (constants.symbolSize / 2 + 1),
                constants.symbolSize + 2, constants.symbolSize + 2);
            plot.drawSymbol[cursor.symbol](ctx, Math.floor(cursor.x) + adj,
                Math.floor(cursor.y) + adj, constants.symbolSize / 2, 0);
        } else {
            ctx.fillRect(Math.floor(cursor.x) + adj - (constants.symbolSize / 2),
                Math.floor(cursor.y) + adj - (constants.symbolSize / 2),
                constants.symbolSize, constants.symbolSize);
        }

        ctx.stroke();
    }

    function hasVerticalLine(cursor) {
        return (cursor.mode.indexOf('x') !== -1);
    }

    function hasHorizontalLine(cursor) {
        return (cursor.mode.indexOf('y') !== -1);
    }

    function mouseOverCursorManipulator(e, plot, cursor) {
        var offset = plot.offset();
        var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
        var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));
        var grabRadius = constants.symbolSize + constants.mouseGrabMargin;

        return ((mouseX > cursor.x - grabRadius) && (mouseX < cursor.x + grabRadius) &&
            (mouseY > cursor.y - grabRadius) && (mouseY < cursor.y + grabRadius)) &&
            (cursor.symbol !== 'none');
    }

    function mouseOverCursorVerticalLine(e, plot, cursor) {
        var offset = plot.offset();
        var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
        var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));
        var mouseGrabMarginY = cursor.drawAnchor ? -15 : 0; 

        return (hasVerticalLine(cursor) && (mouseX > cursor.x - constants.mouseGrabMargin) &&
            (mouseX < cursor.x + constants.mouseGrabMargin) && (mouseY > mouseGrabMarginY) && (mouseY < plot.height()));
    }

    function mouseOverCursorHorizontalLine(e, plot, cursor) {
        var offset = plot.offset();
        var mouseX = Math.max(0, Math.min(e.pageX - offset.left, plot.width()));
        var mouseY = Math.max(0, Math.min(e.pageY - offset.top, plot.height()));
        var mouseGrabMarginX = cursor.drawAnchor ? -15 : 0;

        return (hasHorizontalLine(cursor) && (mouseY > cursor.y - constants.mouseGrabMargin) &&
            (mouseY < cursor.y + constants.mouseGrabMargin) && (mouseX > mouseGrabMarginX) && (mouseX < plot.width()));
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'cursors',
        version: '0.1'
    });
})(jQuery);

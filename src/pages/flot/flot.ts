import { Component, ElementRef, AfterViewInit } from '@angular/core';
declare var $: any;

@Component({
    templateUrl: 'flot.html'
})
export class FlotPage implements AfterViewInit {

    public width = '100%';
    public height = '100%';
    public chosenInitialized = false;

    public options: any;
    public dataset: any;
    public dataset2: any;
    public count: number = 0;
    public plot: any;
    public mousemoveEventRef = this.chartMouseMove.bind(this);
    public verticalPanRef = this.verticalPan.bind(this);
    public xPositionPixels;
    public yPositionPixels;
    public base = 7;
    public voltBase = 0;

    constructor(public el: ElementRef) {
        this.options = {
            series: {
                lines: { show: true },
                points: {
                    radius: 3,
                    show: true
                }
            }
        };

        this.dataset = [{ label: "line1", color: "blue", data: [[1, 130], [2, 40], [3, 80], [4, 160], [5, 159], [6, 370], [7, 330], [8, 350], [9, 370], [10, 400], [11, 330], [12, 350]] }];
        this.dataset2 = [{ label: "line1", color: "green", data: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]] }];
    }

    ngAfterViewInit() {
        if (!this.chosenInitialized) {
            let plotArea = $('#flotContainer');
            plotArea.css({
                width: this.width,
                height: this.height
            });
            this.plot = $.plot(plotArea, this.dataset, this.options);
            this.chosenInitialized = true;
        }
    }

    chartMouseDown(event) {
        console.log('custom mousedown event');
        console.log(event);
        this.xPositionPixels = event.clientX;
        this.yPositionPixels = event.clientY;
        if (event.shiftKey) {
            $('#flotContainer').bind('mousemove', this.verticalPanRef);
        }
        else {
            $('#flotContainer').bind('mousemove', this.mousemoveEventRef);
        }
    }

    chartMouseUp(event) {
        console.log(event);
        $('#flotContainer').unbind('mousemove', this.mousemoveEventRef);
        $('#flotContainer').unbind('mousemove', this.verticalPanRef);
    }

    chartMouseMove(event) {
        let getAxes = this.plot.getAxes();
        let newVal = getAxes.xaxis.c2p(event.clientX);
        let oldValinNewWindow = getAxes.xaxis.c2p(this.xPositionPixels);
        let difference = newVal - oldValinNewWindow;
        let newPos = this.base - difference;
        let min = newPos - 1 * 5;
        let max = newPos + 1 * 5;
        getAxes.xaxis.options.min = min;
        getAxes.xaxis.options.max = max;
        this.plot.setupGrid();
        this.plot.draw();
        this.base = newPos;
        this.xPositionPixels = event.clientX;
    }

    verticalPan(event) {
        let getAxes = this.plot.getAxes();
        let newVal = getAxes.yaxis.c2p(event.clientY);
        let oldValinNewWindow = getAxes.yaxis.c2p(this.yPositionPixels);
        let difference = newVal - oldValinNewWindow;
        let newPos = this.voltBase - difference;
        let min = newPos - 0.5 * 5;
        let max = newPos + 0.5 * 5;
        getAxes.yaxis.options.min = min;
        getAxes.yaxis.options.max = max;
        this.plot.setupGrid();
        this.plot.draw();
        this.voltBase = newPos;
        this.yPositionPixels = event.clientY;
    }

    doot() {
        var oilprices = [[0, 0], [1, 1], [2, 2], [3, 3]];

        var exchangerates = [[0, 3], [1, 2], [2, 1], [3, 0]];

        /*function euroFormatter(v, axis) {
            return v.toFixed(axis.tickDecimals) + "€";
        }*/


        this.plot.setData([
            { data: oilprices, label: "Oil price ($)" },
            { data: exchangerates, label: "USD/EUR exchange rate", yaxis: 2 }
        ]/*, {
				//xaxes: [ { mode: "time" } ],
				yaxes: [ { min: 0 }, {
					// align if we are to the right
					alignTicksWithAxis: position == "right" ? 1 : null,
					position: position
				} ],
				legend: { position: "sw" }
			}*/);
        this.plot.setupGrid();
        this.plot.draw();

    }

    cursors() {
        var offset = 0.0;
        var sin = [],
            cos = [];

        function updateData() {
            sin = [];
            cos = [];
            offset += 0.025;
            for (var i = 0; i < 14; i += 0.1) {
                sin.push([i, Math.sin(i + offset)]);
                cos.push([i, Math.cos(i + offset)]);
            }
        }

        let updateChart = function updateChart() {
            //setTimeout(updateChart, 16);
            updateData();

            this.plot.setData([
                {
                    data: sin,
                    label: "sin(x)"
                },
                {
                    data: cos,
                    label: "cos(x)"
                }
            ]);

            this.plot.setupGrid();
            this.plot.draw();

        }.bind(this)

        updateData();
        this.plot = $.plot("#flotContainer", [
            {
                data: sin,
                label: "sin(x)"
            },
            {
                data: cos,
                label: "cos(x)"
            }
        ], {
                series: {
                    lines: {
                        show: true
                    }
                },
                cursors: [
                    {
                        name: 'Red cursor',
                        mode: 'x',
                        color: 'red',
                        showIntersections: false,
                        showLabel: true,
                        symbol: 'triangle',
                        position: {
                            relativeX: 0.75,
                            relativeY: 0.5
                        }
                    },
                    {
                        name: 'Blue cursor',
                        mode: 'xy',
                        color: 'blue',
                        showIntersections: true,
                        snapToPlot: 1,
                        symbol: 'diamond',
                        position: {
                            relativeX: 0.5,
                            relativeY: 0.5
                        }
                    },
                    {
                        name: 'Green cursor',
                        mode: 'y',
                        color: 'green',
                        showIntersections: true,
                        symbol: 'cross',
                        showValuesRelativeToSeries: 0,
                        showLabel: true,
                        fontSize: '10px',
                        fontStyle: 'italic',
                        position: {
                            relativeX: 0.25,
                            relativeY: 0.25
                        }
                    }
                ],
                legend: {
                    show: false
                },
                grid: {
                    hoverable: true,
                    clickable: true,
                    autoHighlight: false,
                    borderWidth: 0,
                    backgroundColor: 'black',
                    labelMargin: 10,
                    margin: {
                        top: 15,
                        left: 10,
                        right: 20,
                        bottom: 10
                    }
                },
                colors: ['orange', '#4487BA', 'ff3b99', '00c864'],
                yaxis: {
                    min: -1.2,
                    max: 1.2,
                    ticks: this.tickGenerator,
                    tickFormatter: this.yTickFormatter,
                    tickColor: '#666666',
                    font: {
                        color: '#666666'
                    }
                },
                xaxis: {
                    ticks: this.tickGenerator,
                    tickFormatter: this.xTickFormatter,
                    tickColor: '#666666',
                    font: {
                        color: '#666666'
                    }
                }
            });

        $("#flotContainer").bind("cursorupdates", function (event, cursordata) {
            console.log(cursordata);
        });
        console.log(this.plot);
        $('#flotContainer').bind('mousedown', this.chartMouseDown.bind(this));
        $('#flotContainer').bind('mouseup', this.chartMouseUp.bind(this));

        updateChart();
    }

    navigation() {
        function sumf(f, t, m) {
            var res = 0;
            for (var i = 1; i < m; ++i) {
                res += f(i * i * t) / (i * i);
            }
            return res;
        }

        var d1 = [];
        for (var t = 0; t <= 2 * Math.PI; t += 0.01) {
            d1.push([sumf(Math.cos, t, 10), sumf(Math.sin, t, 10)]);
        }

        var data = [d1],
            placeholder = $("#flotContainer");

        $.plot(placeholder, data, {
            series: {
                lines: {
                    show: true
                },
                shadowSize: 0
            },
            xaxis: {
                zoomRange: [0.1, 10],
                panRange: [-10, 10]
            },
            yaxis: {
                zoomRange: [0.1, 10],
                panRange: [-10, 10]
            },
            zoom: {
                interactive: true
            },
            pan: {
                interactive: true
            }
        });

        // show pan/zoom messages to illustrate events 

        placeholder.bind("plotpan", function (event, plot) {
            var axes = plot.getAxes();
            $(".message").html("Panning to x: " + axes.xaxis.min.toFixed(2)
                + " &ndash; " + axes.xaxis.max.toFixed(2)
                + " and y: " + axes.yaxis.min.toFixed(2)
                + " &ndash; " + axes.yaxis.max.toFixed(2));
        });

        placeholder.bind("plotzoom", function (event, plot) {
            var axes = plot.getAxes();
            $(".message").html("Zooming to x: " + axes.xaxis.min.toFixed(2)
                + " &ndash; " + axes.xaxis.max.toFixed(2)
                + " and y: " + axes.yaxis.min.toFixed(2)
                + " &ndash; " + axes.yaxis.max.toFixed(2));
        });

        // add zoom out button 

        // and add panning buttons

        // little helper for taking the repetitive work out of placing
        // panning arrows


    }

    fileChange(event) {
        if (event.target.files.length === 0) { return }
        let fileReader = new FileReader();
        let fileName = event.target.files[0].name;
        let fileEnding = fileName.slice(fileName.indexOf('.') + 1);
        if (fileEnding === 'csv') {
            fileReader.onload = ((file) => {
                let myFile: any = file;
                this.parseCsv(myFile.target.result);
            });
            fileReader.readAsText(event.target.files[0]);
        }
        else {
            alert('File Type Not Supported');
        }

    }

    parseCsv(fileAsText: string) {
        let points = fileAsText.split('\n');
        console.log(points.length);
        let pointData = points[0].split(',');
        let pointData2 = points[1].split(',');
        let xInterval = parseFloat(pointData2[0]) - parseFloat(pointData[0]);

        let dataContainer = [];
        for (let i = 0; i < pointData.length - 1; i++) {
            dataContainer[i] = [parseFloat(pointData[i + 1])];
        }

        console.log(pointData);
        //Assume first column is time
        //Assume second column is y1
        //Assume third column is y2 etc
        for (let i = 0; i < points.length; i++) {
            let currentPointData = points[i].split(',');
            for (let j = 0; j < currentPointData.length - 1; j++) {
                dataContainer[j].push(parseFloat(currentPointData[j + 1]));
            }
        }
        console.log('data container: ');
        console.log(dataContainer);
        console.log('xInterval: ' + xInterval);
        let customBuffer = []
        for (let i = 0; i < 2000; i++) {
            customBuffer.push([i * xInterval, dataContainer[0][i]]);
        }
        console.log(customBuffer);
        let start = performance.now();


        $.plot("#flotContainer", [
            {
                data: customBuffer,
                label: "sin(x)"
            }
        ], {
                series: {
                    lines: {
                        show: true
                    }
                },
                xaxis: {
                    zoomRange: [0.1, 10],
                    panRange: [-10, 10]
                },
                zoom: {
                    interactive: true
                },
                pan: {
                    interactive: true
                },
                cursors: [
                    {
                        name: 'Red cursor',
                        mode: 'x',
                        color: 'red',
                        showIntersections: false,
                        showLabel: true,
                        symbol: 'triangle',
                        position: {
                            relativeX: 0.75,
                            relativeY: 0.5
                        }
                    },
                    {
                        name: 'Blue cursor',
                        mode: 'xy',
                        color: 'blue',
                        showIntersections: true,
                        snapToPlot: 1,
                        symbol: 'diamond',
                        position: {
                            relativeX: 0.5,
                            relativeY: 0.5
                        }
                    },
                    {
                        name: 'Green cursor',
                        mode: 'y',
                        color: 'green',
                        showIntersections: true,
                        symbol: 'cross',
                        showValuesRelativeToSeries: 0,
                        showLabel: true,
                        fontSize: '10px',
                        fontStyle: 'italic',
                        position: {
                            relativeX: 0.25,
                            relativeY: 0.25
                        }
                    }
                ],
                grid: {
                    hoverable: true,
                    clickable: true,
                    autoHighlight: false
                },
                yaxis: {
                    min: -1.2,
                    max: 1.2,
                    zoomRange: [0.1, 10],
                    panRange: [-10, 10]
                }
            });

        $("#flotContainer").bind("cursorupdates", function (event, cursordata) {
            console.log(cursordata);
        });
        let finish = performance.now();
        console.log('plot time: ' + (finish - start));

        //let waveformComponentArray: WaveformComponent[] = [];

        /*for (let i = 0; i < dataContainer.length; i++) {
            let waveform = {
                y: dataContainer[i],
                t0: 0,
                dt: xInterval,
                pointOfInterest: 0,
                triggerPosition: undefined,
                seriesOffset: 0
            };
            //waveformComponentArray[i] = new WaveformComponent(waveform);
        }*/
        //this.chart.clearExtraSeries([0, 1]);
        //this.chart.setCurrentBuffer(waveformComponentArray);
        /*for (let i = 0; i < dataContainer.length; i++) {
            //this.chart.drawWaveform(i, waveformComponentArray[i], true);
        }*/
    }

    tickGenerator(axis) {
        let min = axis.min;
        let max = axis.max;
        let interval = (max - min) / 10;
        let ticks = [];
        for (let i = 0; i < 11; i++) {
            ticks.push(i * interval + min);
        }
        return ticks;
    }

    yTickFormatter(val, axis) {
        let vPerDiv = Math.abs(axis.max - axis.min) / 10;
        let i = 0;
        let unit = '';
        while (vPerDiv < 1) {
            i++;
            vPerDiv = vPerDiv * 1000;
        }
        val = (parseFloat(val) * Math.pow(1000, i)).toFixed(0);
        if (i == 0) {
            unit = ' V';
        }
        else if (i == 1) {
            unit = ' mV';
        }
        else if (i == 2) {
            unit = ' uV';
        }
        else if (i == 3) {
            unit = ' nV';
        }
        return (val + unit);
    }

    xTickFormatter(val, axis) {
        let timePerDiv = Math.abs(axis.max - axis.min) / 10;
        if (parseFloat(val) == 0) {
            return 0 + ' s';
        }
        let i = 0;
        let unit = '';
        while (timePerDiv < 1) {
            i++;
            timePerDiv = timePerDiv * 1000;
        }
        val = (parseFloat(val) * Math.pow(1000, i));
        let numDigits = val.toFixed(0).length;
        let fixedDigits = numDigits < 4 ? 4 - numDigits : 0;
        val = val.toFixed(fixedDigits);
        if (i == 0) {
            unit = ' s';
        }
        else if (i == 1) {
            unit = ' ms';
        }
        else if (i == 2) {
            unit = ' us';
        }
        else if (i == 3) {
            unit = ' ns';
        }
        else if (i == 4) {
            unit = ' ps';
        }
        return val + unit;
    }
}

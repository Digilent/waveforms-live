export interface Chart {
    xAxis: Array<any>,
    yAxis: Array<any>,
    series: Array<any>,
    plotTop: number,
    plotLeft: number,
    reflow(),
    redraw(animate?: boolean),
    addSeries(options: Object, redraw: boolean, animation: boolean),
    renderer: any,
    setTitle(titleObject: Object),
    addAxis(options: Object, isX: boolean, redraw: boolean, animation: boolean),
    update(options: any, redraw?: boolean),
    chart: any,
    chartBackground: any,
    options: any,
    highlight(series: any, datapoint: any),
    unhighlight(series: any, datapoint: any),
    setData(data: any),
    setupGrid(),
    draw(),
    triggerRedrawOverlay(),
    width(),
    height(),
    offset(),
    pointOffset(paramObject: any),
    resize(),
    shutdown(),
    getData(),
    getAxes(),
    getPlaceholder(),
    getCanvas(),
    getPlotOffset(),
    getOptions(),
    getActiveXIndex(),
    setActiveXIndex(index: number),
    getActiveYIndices(): number[],
    setActiveYIndices(indexArray: number[]),
    getActiveYAxis(): number,
    setActiveYAxis(axisNum: number),
    getSecsPerDivArray(): number[],
    setSecsPerDivArray(secsPerDivArray: number[]),
    getVoltsPerDivArray(): number[],
    setVoltsPerDivArray(voltsPerDivArray: number[]),
    addCursor(cursorSettings: any),
    getCursors(),
    setCursor(cursor: any, options: any),
    setMultipleCursors(cursorArray: any[], optionsArray: any[]),
    removeCursor(cursorObjectToRemove: any),
    setTimelineRef(timelineChartRef: any),
    getTimelineRef(),
    getTimelineUpdate(),
    setTimelineUpdate(updateTimeline: boolean),
    updateTimelineCurtains(minMaxContainer: any),
    hooks: any,
    unbindMoveEvents()
}

export interface CursorPositions {
    x: number,
    y: number
}

export interface DataContainer {
    data: Array<number[]>,
    yaxis: number,
    lines: {
        show: boolean
    },
    points: {
        show: boolean
    },
    color?: string
}
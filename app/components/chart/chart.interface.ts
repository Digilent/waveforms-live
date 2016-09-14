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
    addAxis(options: Object, isX: boolean, redraw: boolean, animation: boolean)
}

export interface ChartBounds {
    min: number,
    max: number
}

export interface CursorPositions {
    x: number,
    y: number
}
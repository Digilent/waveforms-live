export interface Chart {
    xAxis: Array<any>,
    yAxis: Array<any>,
    series: Array<any>,
    plotTop: number,
    plotLeft: number,
    reflow(),
    redraw(animate?: boolean),
    addSeries(object: Object, something: boolean, somethingElse: boolean),
    renderer: any,
    setTitle(titleObject: Object),
    addAxis(options: Object, something1: boolean, something2: boolean, something3: boolean)
}

export interface ChartBounds {
    min: number,
    max: number
}

export interface CursorPositions {
    x: number,
    y: number
}
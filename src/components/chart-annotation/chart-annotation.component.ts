import { Component, EventEmitter, Output, ElementRef } from '@angular/core';

@Component({
    templateUrl: 'chart-annotation.html',
    selector: 'chart-annotation'
})

export class ChartAnnotationComponent {
    @Output() closeAnnotation: EventEmitter<any> = new EventEmitter();
    public show: boolean = true;
    public topPix: string = '80px';
    public leftPix: string = '80px';
    public contents: string = '';
    public borderColor: string = 'white';
    private startingCoords: { x: number, y: number } = { x: 0, y: 0 };

    constructor(
        private elementRef: ElementRef
    ) {
        console.log('chart annotation constructor');
    }

    kill(event) {
        event.stopPropagation();
        this.closeAnnotation.emit();
    }

    setStyles(left?: string, top?: string, borderColor?: string) {
        if (left) {
            this.leftPix = left;
        }
        if (top) {
            this.topPix = top;
        }
        if (borderColor) {
            this.borderColor = borderColor;
        }
    }

    onMousedown(event) {
        this.startingCoords.x = event.clientX;
        this.startingCoords.y = event.clientY;
        this.elementRef.nativeElement.onmousemove = this.elementRef.nativeElement.parentElement.firstElementChild.onmousemove = (e) => {
            let diffX = this.startingCoords.x - e.clientX;
            let diffY = this.startingCoords.y - e.clientY;
            this.topPix = (parseInt(this.topPix) - diffY) + 'px';
            this.leftPix = (parseInt(this.leftPix) - diffX) + 'px';
            this.startingCoords.x = e.clientX;
            this.startingCoords.y = e.clientY;
        };
        this.elementRef.nativeElement.onmouseup = this.elementRef.nativeElement.parentElement.firstElementChild.onmouseup = (event) => {
            this.elementRef.nativeElement.onmousemove = this.elementRef.nativeElement.parentElement.firstElementChild.onmousemove = null;
            this.elementRef.nativeElement.onmouseup = this.elementRef.nativeElement.parentElement.firstElementChild.onmouseup = null;
        };
    }

}
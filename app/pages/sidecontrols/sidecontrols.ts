import {Page} from 'ionic-angular';

//Components
import {OscilloscopeComponent} from '../../components/oscilloscope/oscilloscope.component';

@Page({
    templateUrl: 'build/pages/sidecontrols/sidecontrols.html',
    directives: [OscilloscopeComponent]
})
export class SideControlsPage {
    public controlsVisible = false;
    constructor() {
        console.log('side control page contructor');
    }
    
    toggleControls()
    {
       this.controlsVisible = !this.controlsVisible;
       console.log(this.controlsVisible);
    }
}

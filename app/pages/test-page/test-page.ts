import {Page} from 'ionic-angular';

//Components
import {SideBarComponent} from '../../components/side-bar/side-bar.component';

@Page({
    templateUrl: 'build/pages/test-page/test-page.html',
    directives: [SideBarComponent]
})
export class TestPage {
    public controlsVisible = false;
    constructor() {
        
    }
    
}
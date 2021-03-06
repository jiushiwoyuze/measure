import {
    Component, OnInit, ChangeDetectionStrategy
} from '@angular/core';

@Component({
    selector: 'demo-tabs',
    templateUrl: './tabs.html',
    styleUrls: ['./tabs.less'],
    preserveWhitespaces: false,
    changeDetection: ChangeDetectionStrategy.Default
})
export class DemoTabs implements OnInit {

    tabsSelected: any;
    tabsDefault: any;
    tabsHover: any;
    tabsPress: any;

    constructor() {
    }

    ngOnInit() {
        this.tabsSelected = [
            { title: '第一项目', content: 'This is the About tab' },
            { title: '第二项目', content: 'This is our blog' },
            { title: '第三项目', content: 'Contact us here' },
            { title: '第四项目', content: 'Contact us here' },
            { title: '第五项目', content: 'Contact us here' },
        ];
        this.tabsDefault = [
            { title: '第一项目', content: 'This is the About tab' },
            { title: '第二项目', content: 'This is our blog', active: true },
            { title: '第三项目', content: 'Contact us here' },
            { title: '第四项目', content: 'Contact us here' },
            { title: '第五项目', content: 'Contact us here' },
        ];
        this.tabsHover = [
            { title: '第一项目', content: 'This is the About tab' },
            { title: '第二项目', content: 'This is our blog' },
            { title: '第三项目', content: 'Contact us here', active: true },
            { title: '第四项目', content: 'Contact us here' },
            { title: '第五项目', content: 'Contact us here' },
        ];
        this.tabsPress = [
            { title: '第一项目', content: 'This is the About tab' },
            { title: '第二项目', content: 'This is our blog' },
            { title: '第三项目', content: 'Contact us here' },
            { title: '第四项目', content: 'Contact us here', active: true },
            { title: '第五项目', content: 'Contact us here' },
        ];
    }
}

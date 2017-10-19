import {
    Component, Input, Output, EventEmitter,
    OnInit, ViewEncapsulation, ChangeDetectionStrategy
} from '@angular/core';

import {ButtonConfig} from '../../component/button';

export function getButtonConfig(): ButtonConfig {
    return Object.assign(new ButtonConfig, { theme: 'yellow' });
}

@Component({
    selector: 'demo-button',
    templateUrl: './button.html',
    styleUrls: ['./button.less'],
    encapsulation: ViewEncapsulation.Emulated,
    changeDetection: ChangeDetectionStrategy.Default,
    providers: [{provide: ButtonConfig, useFactory: getButtonConfig}]
})
export class DemoButton implements OnInit {
    name = 'ComponentName';
    counter = 0;

    size = 'xs';
    constructor() {

    }

    ngOnInit() {

    }

    onClick() {
        this.counter = this.counter + 1;
    }

    changeSize() {
        this.size = 'lg';
    }
}

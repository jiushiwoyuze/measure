import {Input, Component, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
    selector: 'demo-spinner-form',
    templateUrl: './spinner-form.html',
    styleUrls: ['./spinner-form.less'],
    encapsulation: ViewEncapsulation.None
})
export class DemoSpinnerForm {

    form: FormGroup;

    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.form = this.fb.group({
            spinner: [
                {value: 11, disabled: false}
            ]
        });
    }
}

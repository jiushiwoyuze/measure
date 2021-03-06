import {
    Component, Input, ElementRef, SimpleChanges, AfterViewInit, ContentChildren,
    OnChanges, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef,
    QueryList, Renderer2, Optional, forwardRef, Output, EventEmitter, AfterContentInit
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import {coerceBooleanProperty} from '../util/coerce';
import {OnChange} from '../core/decorators';

/** toggle button group types */
export type BUTTON_GROUP_TYPE = 'radio' | 'checkbox';

/** toggle button value type */
export interface ButtonGroupValue {
    /** current toggle button value */
    currentValue: any;

    /** all toogled button value, this is usually an array */
    value: any;
}

/*
 * Provider Expression that allows component to register as a ControlValueAccessor.
 * This allows it to support [(ngModel)].
 * @docs-private
 */
const BUTTONGROUP_VALUE_ACCESSOR = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ButtonGroupComponent),
    multi: true
};

/**
 * Button Group Component
 */
@Component({
    selector: 'nb-button-group',
    templateUrl: './button-group.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    providers: [BUTTONGROUP_VALUE_ACCESSOR],
    host: {
        'class': 'nb-widget nb-button-group'
    },
    exportAs: 'xButtonGroup'
})
export class ButtonGroupComponent implements ControlValueAccessor, AfterContentInit {

    /** button group change event, emit the `ButtonGroupValue`, which with the `currentValue` and `value` property */
    @Output() change: EventEmitter<ButtonGroupValue> = new EventEmitter<ButtonGroupValue>();

    /**
     * button group type, either 'radio' or 'checkbox'
     * @default checkbox
     */
    @OnChange()
    @Input() type: 'radio' | 'checkbox' = 'checkbox';

    /**
     * button group value, can be any type
     */
    @OnChange()
    @Input() value: any;

    /**
     * Whether the button group is disabled
     * @default false
     */
    @OnChange(true)
    @Input() disabled = false;
    disabledChange: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * button toggle children
     */
    @ContentChildren(
        forwardRef(() => ButtonToggleComponent)
    ) _buttonList: QueryList<ButtonToggleComponent>;

    constructor(private renderer: Renderer2, private cd: ChangeDetectorRef) {

    }

    ngOnInit() {
        const self = this;
        // listen to disabled property, and update sub child disabled state
        self.disabledChange.subscribe(disabled => {
            if (self._buttonList) {
                self._buttonList.forEach(box => {
                    box.disabled = box.disabled || disabled;
                });
            }
        });
    }

    ngAfterContentInit() {
        const self = this;
        if (self._buttonList) {
            self._buttonList.forEach(box => {
                box.disabled = box.disabled || self.disabled;
            });
        }
    }

    /**
     * set children toggle button checked state
     *
     * @param {any} value - current toggle button value
     * @docs-private
     */
    select(value: any) {
        if (this.type === 'radio') {
            this._buttonList.forEach(item => {
                item.checked = item.value === value;
            });
            this.value = [value];
            this.change.emit({
                currentValue: value,
                value: this.value
            });
            this._markForCheck();
        }
        else if (this.type === 'checkbox') {
            const button = this._buttonList.find(v => v.value === value);
            const valueSet = new Set(this.value);
            if (button) {
                button.checked = !button.checked;
                button.checked ? valueSet.add(value) : valueSet.delete(value);
                this.value = Array.from(valueSet);
                this.change.emit({
                    currentValue: value,
                    value: this.value
                });
                this._markForCheck();
            }
        }
    }

    /**
     * The method to be called in order to update ngModel.
     * Now `ngModel` binding is not supported in multiple selection mode.
     */
    private _onModelChange: Function;

    /**
     * Registers a callback that will be triggered when the value has changed.
     * Implemented as part of ControlValueAccessor.
     * @param fn On change callback function.
     */
    registerOnChange(fn: Function) {
        this._onModelChange = fn;
    }

    /** onTouch function registered via registerOnTouch (ControlValueAccessor). */
    private _onTouch: Function;

    /**
     * Registers a callback that will be triggered when the control has been touched.
     * Implemented as part of ControlValueAccessor.
     * @param fn On touch callback function.
     */
    registerOnTouched(fn: Function) {
        this._onTouch = fn;
    }

    /**
     * Sets the model value. Implemented as part of ControlValueAccessor.
     * @param value Value to be set to the model.
     */
    writeValue(value: any[]) {
        if (value) {
            this.value = value;

            // when init, set children toggle button state
            this.value.forEach(item => {
                this.select(item);
            });
        }
    }

    /**
     * Toggles the disabled state of the component. Implemented as part of ControlValueAccessor.
     * @param isDisabled Whether the component should be disabled.
     */
    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
        this.cd.markForCheck();
    }

    /**
     * update form model value and mark for check
     */
    _markForCheck() {
        if (this._onModelChange) {
            this._onModelChange(this.value);
        }

        if (this._onTouch) {
            this._onTouch(this.value);
        }

        this.cd.markForCheck();
    }
}

/**
 * A single toggle button, usually used in `nb-button-group`
 * like checkbox, it has a associated value and can be checked and disabled
 */
@Component({
    selector: 'nb-button-toggle',
    template: `
        <span class="nb-button-inner"><ng-content></ng-content></span>
    `,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    host: {
        'class': 'nb-widget nb-button-toggle',
        '[class.nb-button-toggle-checked]': 'checked',
        '[class.nb-button-toggle-disabled]': 'disabled',
        '(click)': 'onToggle()'
    },
    exportAs: 'xButtonToggle'
})
export class ButtonToggleComponent {

    /** toggle event, emit a boolean value */
    @Output() toggle: EventEmitter<boolean> = new EventEmitter<boolean>();

    /**
     * toggle button's value, can be any type
     * @default ''
     */
    @Input() value: any = '';

    /**
     * Whether toggle button is checked
     * @default false
     */
    @OnChange(true)
    @Input() checked: boolean = false;

    /**
     * Whether toggle button is disabled
     * @default false
     */
    @OnChange(true)
    @Input() disabled: boolean = false;

    /**
     * Whether toggle button is single, not wrapped by an button group component
     * @docs-private
     */
    _isSingleButton: boolean = true;

    /**
     * Reference to the wrapped parent button group component
     * @docs-private
     */
    buttonGroup: ButtonGroupComponent;

    /**
     * Creates an instance of ButtonToggleComponent.
     * @param {ButtonGroupComponent?} buttonGroup - the optional wrapped parent button group component
     */
    constructor(@Optional() buttonGroup: ButtonGroupComponent) {

        this.buttonGroup = buttonGroup;
        this._isSingleButton = !this.buttonGroup;
    }

    /**
     * Toggle event
     *
     * @docs-private
     */
    onToggle() {
        if (this.disabled) {return;}

        // if not a single toggle button, tell the parent button group component
        // to toggle proper buttons according to type
        if (!this._isSingleButton) {
            this.buttonGroup.select(this.value);
        }
        // if a single toggle button, just emit the toggle event
        else {
            this.checked = !this.checked;
            this.toggle.emit(this.checked);
        }
    }
}

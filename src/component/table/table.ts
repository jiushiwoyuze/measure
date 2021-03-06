import {
    Component, Input, Output, EventEmitter, Directive, QueryList, ContentChildren, ElementRef,
    OnInit, ViewEncapsulation, ChangeDetectionStrategy, forwardRef, AfterContentInit, ViewChild,
    Renderer2, Optional, ChangeDetectorRef, AfterContentChecked
} from '@angular/core';

import {OnChange} from '../core/decorators';

/** table order type */
export type OrderType = 'asc' | 'desc' | '';

/** html element position */
export interface ElementPosition {
    left: number;
    top: number;
};

/** table sort param interface */
export interface SortParam {
    /** sort field */
    orderBy: string;

    /** sort type */
    order: OrderType;
};

/** table filter param interface */
export interface FilterParam {
    /** filter field */
    field: string;

    /** filter table header item component */
    target: TableHeaderItemComponent;
}

/**
 * Table Component
 */
@Component({
    selector: 'table[nb-table]',
    templateUrl: './table.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    host: {
        'class': 'nb-widget nb-table',
        '(mousemove)': 'onMouseMove($event)',
        '(mouseup)': 'onMouseUp()'
    },
    exportAs: 'nbTable'
})
export class TableComponent implements OnInit, AfterContentInit {

    /** table sort event emitter */
    @Output() sort: EventEmitter<SortParam> = new EventEmitter<SortParam>();

    /** table all datasource */
    @Input() allDatasource: any[] = [];

    /** table filterd(sort、filterd) datasource */
    @Input() datasource: any[] = [];

    /**
     * table order state, can be '' or 'desc' or ''
     * if order value is changed, no matter what value it was before, a orderChange will happen
     */
    @OnChange(false, true)
    @Input() order: OrderType;

    /** table order state change event listener */
    orderChange: EventEmitter<string> = new EventEmitter<string>();

    /**
     * table orderby field
     * no matter what value ti was, when a orderBy change，a orderByChange will happen
     */
    @OnChange(false, true)
    @Input() orderBy: string;

    /** table orderby field change event listener */
    orderByChange: EventEmitter<string> = new EventEmitter<string>();

    /** table current page */
    @OnChange()
    @Input() page: number;

    /** table page change event listener */
    pageChange: EventEmitter<number> = new EventEmitter<number>();

    /** table pageSize field */
    @OnChange()
    @Input() pageSize: string;

    /** table pageSize change event listener */
    pageSizeChange: EventEmitter<string> = new EventEmitter<string>();

    /** Whether the table columns can be resizable */
    @OnChange(true)
    @Input() resizable: boolean = false;

    /**
     * table head item children
     * @docs-private
     */
    @ContentChildren(
        forwardRef(() => TableHeaderItemComponent), {descendants: true}
    ) _headItems: QueryList<TableHeaderItemComponent>;

    /**
     * resize indicator line
     * @docs-private
     */
    @ViewChild('resizeLine') _resizeLine: ElementRef;

    /**
     * cache table position
     * @docs-private
     */
    _tablePos: ElementPosition;

    /**
     * current resize column index when resizing table columns
     * @docs-private
     */
    _columnIndex: number = 0;

    /**
     * current resize column start position when resizing table columns
     * @docs-private
     */
    _startPos: number;

    /**
     * whether the table is resizing column
     * @docs-private
     */
    _isDragging: boolean = false;

    /**
     * the distance when resizing column, if < 0, then the current column width will decrease _dx
     * and the next sibling column width will increase _dx
     */
    _distance: number = 0;

    constructor(private _el: ElementRef, private _render: Renderer2) {
        this.listenSortParamChange();
    }

    /**
     * listen sort related param change
     * @docs-private
     */
    listenSortParamChange() {
        let self = this;
        self.orderChange.subscribe(
            (order: string) => {
                if (self._headItems) {
                    // reset other head item order status
                    self._headItems.forEach(v => {
                        if (v.field !== self.orderBy) {
                            v.order = '';
                        }
                    });

                    // emit sort param
                    self.sort.emit({
                        order: (order as OrderType),
                        orderBy: self.orderBy
                    });
                }
            }
        );

        self.orderByChange.subscribe((orderBy: string) => {
                // emit sort param
                self.sort.emit({
                    order: self.order,
                    orderBy: orderBy
                });
            }
        )
    }

    ngOnInit() {
        // cache all datasource
        this.allDatasource = [...this.datasource];
    }

    ngAfterContentInit() {

        // set child item index
        if (this._headItems) {
            this._headItems.forEach((v, columnIndex) => {
                v._columnIndex = columnIndex;
            });
        }
    }

    /**
     * get table native elment position(left && top)
     * @docs-private
     */
    getTablePosition() {
        try {
            const el = this._el.nativeElement as HTMLTableElement;

            // avoid frequently computing table positions
            if (!this._tablePos) {

                this._tablePos = {
                    left: el.offsetLeft,
                    top: el.offsetTop
                };
            }
            return this._tablePos;
        }
        catch (e) {
            throw new Error('get table position error');
        }
    }

    /**
     * set column resize start position
     * @param {number} left - left position relative to the table
     * @param {number} columnIndex - currently resize column
     * @docs-private
     */
    setColumeResizeStartPosition(left: number, columnIndex: number) {
        this._startPos = left;
        this._columnIndex = columnIndex;

        this.updateResizeLinePosition(left);
    }

    /**
     * update resize indicator line
     * @param {number} left - the left position of indicator line relative to the table
     * @docs-private
     */
    updateResizeLinePosition(left: number) {
        const el = this._resizeLine.nativeElement;
        this._render.setStyle(el, 'left', left + 'px');
    }

    /**
     * table mousemove event, update resize indicator line position
     * @param {MouseEvent} event - mouse event
     * @docs-private
     */
    onMouseMove(event: MouseEvent) {

        if (this._isDragging) {

            // table left position
            const pos = this.getTablePosition();

            // current end position relative to the table
            const endPos = event.clientX - pos.left;

            // current end position relative to the table subtracts start position relative to the table
            this._distance = endPos - this._startPos;

            // update resize indicator line position to the end position
            this.updateResizeLinePosition(endPos);

            // it's important here, and it will prevent default behavior like copy content from table
            return false;
        }
    }

    /**
     * talbe mouseup event, when not resize column, do nothing
     * when resize column, update column width and set resizing flag to false
     * @docs-private
     */
    onMouseUp() {
        if (this._isDragging) {
            this.updateTableHeadItemWidth();
            this._isDragging = false;
        }
    }

    /**
     * get origin column width array
     * @return {number[]} column width array
     * @docs-private
     */
    getOriginHeadItemWidth() {
        let columnWidthArray: number[] = [];
        if (this._headItems) {
            this._headItems.forEach((v, columnIndex) => {
                columnWidthArray[columnIndex] = v.getElementWidth();
            });
            return columnWidthArray;
        }
        return [];
    }

    /**
     * when column resize is done, update table head item width
     * @docs-private
     */
    updateTableHeadItemWidth() {

        // set newer column width array
        let newColWidths = this.getNewColumnWidth();

        if (this._headItems) {
            this._headItems.forEach((v, columnIndex) => {
                v.setElementWidth(newColWidths[columnIndex]);
            });
        }
    }

    /**
     * when column resize is done, compute the new column width array
     */
    getNewColumnWidth(): number[] {
        const self = this;

        // cache distance
        const distance = self._distance;

        // get origin column width array
        let colWidths = self.getOriginHeadItemWidth();

        // set newer column width array
        let newColWidths: number[] = [];

        // compute newer colum width
        colWidths.forEach((width, columnIndex) => {

            // if is current column, add the distance, for example
            // drag to left 10px distance will be 10, drap to right 10px distance will be -10
            if (columnIndex === self._columnIndex) {
                newColWidths[columnIndex] = width + distance;
            }
            // if is next sibling column, substract the distance
            else if (columnIndex === self._columnIndex + 1) {
                newColWidths[columnIndex] = width - distance;
            }
            // other column width will remain the same
            else {
                newColWidths[columnIndex] = width;
            }
        });

        console.log(`origin widthes: `, colWidths);
        console.log(`distance: `, distance);
        console.log(`newer widthes: `, newColWidths);

        return newColWidths;
    }
}

/**
 * table header component
 */
@Component({
    selector: 'thead[nb-thead]',
    template: `<ng-content></ng-content>`,
    preserveWhitespaces: false,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'class': 'nb-table-head'}
})
export class TableHeaderComponent {}

/**
 * table header item component
 */
@Component({
    selector: 'th[nb-th], th[field]',
    template: `
        <ng-content></ng-content>

        <ng-container *ngIf="tipable">
            <i class="iconfont icon-question" (mouseover)="onShowTip($event)" (mouseout)="onHideTip()"></i>
        </ng-container>

        <ng-container *ngIf="filterable">
            <i
                class="iconfont icon-filter"
                [class.active]="showFilter || filtered"
                (click)="onToggleFilter($event)">
            </i>
        </ng-container>

        <ng-container *ngIf="sortable">
            <span
                title="sort"
                (click)="onSort()"
                class="sort-group"
                [class.sort-group-asc]="order=='asc'"
                [class.sort-group-desc]="order=='desc'">
                <i class="iconfont icon-sort-desc"></i>
                <i class="iconfont icon-sort-asc"></i>
            </span>
        </ng-container>

        <ng-template #tip>
            <ng-content select=".tip-content"></ng-content>
        </ng-template>

        <div #tipPanel class="table-tip-panel" [class.hide]="!showTip" (mouseover)="onClearTimer()" (mouseout)="onHideTip()">
            <ng-container *ngTemplateOutlet="tip"></ng-container>
        </div>

        <ng-template #filter>
            <ng-content select="[nb-table-filter]"></ng-content>

            <div *ngIf="showFilterButton" class="filter-content-button">
                <button size="sm" theme="primary" nb-button (click)="onFilter()">筛选</button>
                <button size="sm" theme="default" nb-button (click)="onCancel()">取消</button>
            </div>
        </ng-template>

        <div #filterPanel class="table-filter-panel" [class.hide]="!showFilter">
            <ng-container *ngTemplateOutlet="filter"></ng-container>
        </div>

        <div
            *ngIf="resizable"
            class="table-resize-bar"
            (mousedown)="onColumnResizeBegin($event)">
        </div>
    `,
    preserveWhitespaces: false,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'class': 'nb-table-td nb-table-th'},
    exportAs: 'nbTH'
})
export class TableHeaderItemComponent implements OnInit {

    /**
     * table filter event
     */
    @Output() filter: EventEmitter<FilterParam> = new EventEmitter<FilterParam>();

    /**
     * table sort event
     */
    @Output() sort: EventEmitter<SortParam> = new EventEmitter<SortParam>();

    /**
     * Whether the column is sortable
     */
    @OnChange(true)
    @Input() sortable: boolean;

    /**
     * Whether the column is tipable（has tip icon with tip information）
     */
    @OnChange(true)
    @Input() tipable: boolean;

    /**
     * Whether the column is filterable（has filter icon and custom filter panel）
     */
    @OnChange(true)
    @Input() filterable: boolean;

    /**
     * Whether the filter panel should show filter buttons, e.g. when a single select filter, there
     * no need filter button to trigger the filter event
     */
    @Input() showFilterButton: boolean = true;

    /**
     * column order(sort) type, can be 'asc' or 'desc' or ''
     */
    private _order: OrderType;

    @Input() get order() {return this._order;}
    set order(value: any) {
        this._order = value;
        this._cd.markForCheck();
    }

    /**
     * column related data field
     */
    @Input() field: string;

    /**
     * Whether the column is resizable
     */
    @OnChange(true)
    @Input() resizable: boolean = false;

    /**
     * the timeout when the tip panel hide
     */
    @Input() timeout = 200;

    /**
     * the index in the table columns
     * @docs-private
     */
    _columnIndex: number = 0;

    @ViewChild('tipPanel') tipPanel: ElementRef;
    @ViewChild('filterPanel') filterPanel: ElementRef;

    /**
     * Whether show the tip panel
     * @docs-private
     */
    showTip = false;

    /**
     * Whether show the filter panel
     * @docs-private
     */
    private _showFilter: boolean;
    get showFilter() {return this._showFilter;}
    set showFilter(value: any) {
        this._showFilter = value;
        this._cd.markForCheck();
    }

    /**
     * Whether the column is in filtered mode
     * @docs-private
     */
    filtered = false;

    /**
     * reference the tip timeout
     * @docs-private
     */
    t: any;

    /**
     * cache table position
     * @docs-private
     */
    _tablePos: any;

    constructor(
        @Optional() private _table: TableComponent,
        private _cd: ChangeDetectorRef,
        private _el: ElementRef,
        private _render: Renderer2
    ) {}

    ngOnInit() {
        if (this._table) {

            // set default sort status
            if (this._table.orderBy === this.field) {
                this.order = this._table.order;
            }

            // it resizable only table can be resizable and column can be resizable
            this.resizable = this._table.resizable /**&& this.resizable **/;
        }
    }

    /**
     * show tip panel
     *
     * @param {MouseEvent} event - mouse event
     * @docs-private
     */
    onShowTip(event: MouseEvent) {
        clearTimeout(this.t);

        this.showTip = true;
        if (this.tipPanel && this.tipPanel.nativeElement) {
            const el = this.tipPanel.nativeElement;
            const target = event.target as HTMLElement;

            // set tip panel position
            this._render.setStyle(el, 'left', (target.offsetLeft + 20) + 'px');
            this._render.setStyle(el, 'top', (target.offsetTop - 20) + 'px');
        }
    }

    /**
     * hide tip panel
     * @docs-private
     */
    onHideTip() {
        const self = this;
        self.t = window.setTimeout(() => {
            self.showTip = false;
            self._cd.markForCheck();
        }, self.timeout);
    }

    /**
     * clear tip timer
     * @docs-private
     */
    onClearTimer() {
        clearTimeout(this.t);
    }

    /**
     * toggle filter panel
     * @param {MouseEvent} event  - mouse event
     * @docs-private
     */
    onToggleFilter(event: MouseEvent) {
        this.showTip = false;
        this.showFilter = !this.showFilter;
        this._cd.markForCheck();

        if (this.filterPanel && this.filterPanel.nativeElement) {
            const el = this.filterPanel.nativeElement;
            const target = event.target as HTMLElement;

            // set filter panel position
            this._render.setStyle(el, 'left', (target.offsetLeft) + 'px');
            this._render.setStyle(el, 'top', (target.offsetTop + 20) + 'px');
        }
    }

    ngDestroy() {
        clearTimeout(this.t);
    }

    /**
     * get the column width
     * @return {number} column width
     * @docs-private
     */
    getElementWidth() {
        const el = this._el.nativeElement as HTMLElement;
        return el.getBoundingClientRect().width;
    }

    /**
     * set the column width
     * @param {number} width - column width
     * @docs-private
     */
    setElementWidth(width: number) {
        const el = this._el.nativeElement as HTMLElement;
        this._render.setStyle(el, 'width', width + 'px');
    }

    /**
     * on column filter
     * @docs-private
     */
    onFilter() {
        // in filter mode
        this.filtered = true;

        // hide filter panel
        this.showFilter = false;

        // emit filter params
        this.filter.emit({
            field: this.field,
            target: this
        });
    }

    /**
     * hide filter
     * @docs-private
     */
    onCancel() {
        this.showFilter = false;
    }

    /**
     * on column sort
     * @docs-private
     */
    onSort() {
        this.order = (!this.order || this.order === 'asc') ? 'desc' : 'asc';

        // update table current order and orderBy
        if (this._table) {
            this._table.orderBy = this.field;
            this._table.order = this.order;
        }

        // emit sort params
        this.sort.emit({
            orderBy: this.field,
            order: this.order
        });
    }

    /**
     * column resize begin
     * @param {MouseEvent} event - mouse event
     * @docs-private
     */
    onColumnResizeBegin(event: MouseEvent) {

        // cache table position
        if (!this._tablePos) {
            this._tablePos = this._table.getTablePosition();
        }

        // compute left position relative to the table
        const leftRelativeTable = event.clientX - this._tablePos.left;

        // mark the table is resizing columns
        this._table._isDragging = true;

        // tell the parent table the `_columnIndex`th column is resizing columns
        this._table.setColumeResizeStartPosition(leftRelativeTable, this._columnIndex);

        // it's important here to prevent default copy behaviors
        return false;
    }
}

/**
 * table body component
 */
@Component({
    selector: 'tbody[nb-tbody]',
    template: `<ng-content></ng-content>`,
    preserveWhitespaces: false,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {'class': 'nb-table-body'},
    exportAs: 'nbTableBody'
})
export class TableBodyComponent implements AfterContentChecked {

    /**
     * table row components
     */
    @ContentChildren(forwardRef(() => TableRowComponent)) _children: QueryList<TableRowComponent>;

    ngAfterContentChecked() {

        // todo: when sort  update row even property
        setTimeout(() => {
            this._children.forEach((v, idx) => {
                v.even = !(idx % 2);
            });
        }, 100);
    }
}

/**
 * table row component
 */
@Component({
    selector: 'tr[nb-row]',
    template: `<ng-content></ng-content>`,
    preserveWhitespaces: false,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'class': 'nb-table-row',
        '[class.nb-table-row-even]': 'even',
        '[class.nb-table-row-odd]': '!even'
    },
    exportAs: 'nbRow'
})
export class TableRowComponent {

    /** Whether the row is a even row */
    even: boolean;
}

/**
 * table td component
 */
@Component({
    selector: 'td[nb-td]',
    template: `<ng-content></ng-content>`,
    host: {'class': 'nb-table-td'},
    preserveWhitespaces: false,
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs: 'nbTd'
})
export class TableTdComponent {}


// @Directive({
//     selector: 'nb-table-filter',
//     host: {'class': 'nb-table-filter'},
//     exportAs: 'nbTableFilter'
// })
// export class TableFilterComponent {
//     filterField: string;
//     filterValue: any;
// }

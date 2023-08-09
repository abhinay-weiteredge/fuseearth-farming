import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-dbftable',
  templateUrl: './dbftable.component.html',
  styleUrls: ['./dbftable.component.scss']
})
export class DbfTableComponent implements OnInit {
  @ViewChild('container') _containerEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  private _popupOverlay: Overlay;
  tableData = [];
  tableColumns = [];
  static _popupOverlay: any;
  static _containerEl: any;
  static _closerEl: any;
  static close: any;
  static tableColumns: any;
  static tableData: any[];


  constructor() { }

  ngOnInit() { }

  static getdbfTablePopup() {
    this._popupOverlay = new Overlay({
      element: this._containerEl.nativeElement,
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });
    this._closerEl.nativeElement.onclick = () => {
      this.close();
    };
    return this._popupOverlay;
  }

  public close() {
    this._popupOverlay.setPosition(undefined);
    this._closerEl.nativeElement.blur();
    return false;
  }

  static setPropertyValues(tableData, tableColumns) {
    this.tableColumns = tableColumns;
    this.tableData = [];
    Object.entries(tableData).forEach(entry => {
      const dataRow = [];
      Object.entries(entry[1]).forEach( data => {
        dataRow.push(data[1]);
      });
      this.tableData.push(dataRow);
    });
  }
}

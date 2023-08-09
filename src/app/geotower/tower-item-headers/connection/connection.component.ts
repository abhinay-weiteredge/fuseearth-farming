import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
})
export class ConnectionComponent implements OnInit, AfterViewInit {
  @ViewChild('container') _containerEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  private _popupOverlay: Overlay;
  connProperties = [];

  constructor() { }

  ngOnInit() { }
  ngAfterViewInit(): void { }
  getConnectionPopup() {
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

  setPropertyValues(connectionProperties) {
    this.connProperties = [];
    Object.entries(connectionProperties).forEach(entry => {
      const jsonObj = {
        title : entry[0],
        value : entry[1]
      };
      this.connProperties.push(jsonObj);
  });
  }

}

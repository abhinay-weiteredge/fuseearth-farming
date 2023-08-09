import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-function',
  templateUrl: './function.component.html',
  styleUrls: ['./function.component.scss']
})
export class FunctionComponent implements OnInit {
  @ViewChild('container') _containerEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  private _popupOverlay: Overlay;
  funProperties = [];

  constructor() { }

  ngOnInit() { }
  getFunctionPopup() {
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

  setPropertyValues(funProperties) {
    this.funProperties = [];
    Object.entries(funProperties).forEach(entry => {
      const jsonObj = {
        title: entry[0],
        value: entry[1]
      };
      this.funProperties.push(jsonObj);
    });
  }

}

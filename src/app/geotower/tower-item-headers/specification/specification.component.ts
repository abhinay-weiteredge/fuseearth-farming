import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-specification',
  templateUrl: './specification.component.html',
  styleUrls: ['./specification.component.scss']
})
export class SpecificationComponent implements OnInit {
  @ViewChild('container') _containerEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  private _popupOverlay: Overlay;
  speProperties = [];

  constructor() { }

  ngOnInit() { }

  getSpecificationPopup() {
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

  setPropertyValues(speProperties) {
    this.speProperties = [];
    Object.entries(speProperties).forEach(entry => {
      const jsonObj = {
        title: entry[0],
        value: entry[1]
      };
      this.speProperties.push(jsonObj);
    });
  }

}

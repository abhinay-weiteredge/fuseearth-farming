import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import Overlay from 'ol/Overlay';

@Component({
  selector: 'app-interaction',
  templateUrl: './interaction.component.html',
  styleUrls: ['./interaction.component.scss']
})
export class InteractionComponent implements OnInit {
  @ViewChild('container') _containerEl: ElementRef;
  @ViewChild('closer') _closerEl: ElementRef;
  private _popupOverlay: Overlay;
  intProperties = [];

  constructor() { }

  ngOnInit() { }

  getInteractionPopup() {
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

  setPropertyValues(intProperties) {
    this.intProperties = [];
    Object.entries(intProperties).forEach(entry => {
      const jsonObj = {
        title: entry[0],
        value: entry[1]
      };
      this.intProperties.push(jsonObj);
    });
  }

}

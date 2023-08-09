import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-geobar-alert',
  templateUrl: './geobar-alert.component.html',
  styleUrls: ['./geobar-alert.component.scss']
})
export class GeobarAlertComponent {
  @ViewChild('ngbAlert') _ngbAlertEl: ElementRef;
  @Input() alertMessage: string;
  @Input() activeAlert: boolean = false;
  constructor() { }

  setAlertMessage(message) {
    console.log('ngbAlert : ', this._ngbAlertEl);
    this.activeAlert = true;
    this.alertMessage = message;
    return this._ngbAlertEl;
  }

  closeAlert() {
    if (this.activeAlert) {
      this.activeAlert = !this.activeAlert;
    }
  }
  showAlert(error = 'Error...') {
    this.alertMessage = error;
    this.activeAlert = true;
  }
}

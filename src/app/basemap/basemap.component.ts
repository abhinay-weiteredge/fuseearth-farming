import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';
import { BasemapService } from './basemap.service';
import { Subject } from 'rxjs';
import Geolocation from 'ol/Geolocation';
import { AuthObservableService } from '../Services/authObservableService';

@Component({
  selector: 'app-basemap',
  templateUrl: './basemap.component.html',
  styleUrls: ['./basemap.component.scss']
})
export class BasemapComponent implements OnInit {

  @Input() basemapType: string;
  @Input() pageType = 'DEFAULT';
  @ViewChild('scale-line-customes') scaleLine: ElementRef;
  observable: Subject<any>;
  toolCursorIcon = { cursor: 'auto' };
  longitude = -119.417931; // 78.433237;
  latitude = 36.778259; // 17.661594;
  constructor(private basemapService: BasemapService, private authObsr: AuthObservableService) { }

  ngOnInit() {
    const mapOptions = {
      target: 'mapView',
      longitude: this.pageType === 'COVID19' ? '78.9629' : this.longitude,
      latitude: this.pageType === 'COVID19' ? '20.5937' : this.latitude,
      // longitude: this.longitude,
      // latitude: this.latitude,
      zoom: this.pageType === 'COVID19' ? 5 : 4,
      scaleLine: this.scaleLine,
      pageType: this.pageType
    };
    const basemap = this.basemapService.getBasemapByType(this.basemapType, mapOptions);
    if (this.pageType === 'COVID19') {
      this.authObsr.updateBaseLayerName('Google Maps');
    }

    this.basemapService.iconChanger.subscribe(icon => {
      this.toolCursorIcon = { cursor: icon };
    });
  }
}

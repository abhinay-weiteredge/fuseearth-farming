import { Component, OnInit, ElementRef, ViewChild, Input, SimpleChange,
        Renderer2, RendererFactory2, AfterViewInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonService } from '../Services/common.service';
import { BasemapService } from '../basemap/basemap.service';

import { unByKey } from 'ol/Observable.js';
import { Subject } from 'rxjs';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import OlOverlay from 'ol/Overlay';
import { AuthObservableService } from '../Services/authObservableService';


@Component({
  selector: 'app-compass',
  templateUrl: './compass.component.html',
  styleUrls: ['./compass.component.scss'],
  // tslint:disable-next-line:no-host-metadata-property
  host: {
    style: 'position: absolute; top: 100px; left: 100px;'
  }
})
export class CompassComponent implements OnInit, AfterViewInit, OnChanges {

  @ViewChild('comPointer') comPointer: ElementRef<HTMLDivElement>;
  @ViewChild('pointerContainer') pointerContainer: ElementRef<HTMLDivElement>;
  @ViewChild('compassContainer') compassContainer: ElementRef<HTMLDivElement>;
  defaultAngle = 75;
  @Input() lat1 = 18.979026;
  @Input() lon1 = 31.254986;
  @Input() coOrds: any[] = [];
  @Input() showCompass = '';
  @Input() hideCompass = '';
  @Output() compassClosed: EventEmitter<any> = new EventEmitter<any>();
  magneticDeclination = 0;

  private locationClickIcon: string;
  private listener: any;
  positionMarkObserver: Subject<any> = new Subject<any>();
  private renderer: Renderer2;
  latitude = '18.979026';
  longitude = '31.254986';
  coord: any[];

  private basemap: OlMap;
  markerLayer: OlOverlay;
  markerZoom: OlView;
  locationInfo = 'Loading...';
  constructor( private http: HttpClient, private commonService: CommonService,
               private basemapService: BasemapService,
               private rendererF: RendererFactory2, private obsr: AuthObservableService) {
      this.renderer = this.rendererF.createRenderer(null, null);
      this.locationClickIcon = 'url(/assets/tool-icons/map-icons/PTB.svg) 25 45, auto';
    }

  ngOnInit(): void{
    this.basemapService.getCurrentBasemap().getView().on('propertychange', (e) => {
      if (e.key === 'rotation') {
        // console.log(e);
        // console.log({oldValue:e.oldValue, currValue:e.target.values_.rotation});
        const newRotateAngle = 180 * e.target.values_.rotation / Math.PI;
        this.compassContainer.nativeElement.style.transform = 'rotate(' + newRotateAngle + 'deg)';
      }
    });
    // this.setAnimation();
    // setTimeout(() => {
    //   this.removeAnimation();
    //   this.setAngle(90);
    // }, 5000);
    this.getMagneticDeclination(this.lat1, this.lon1);
    // this.positionMarkObserver.subscribe(res => {
    //   console.log('POSITION MARKED');
    //   console.log(res);
    //   const coords = res['co-ordinates'];
    //   this.setCompassToLayer();
    // });
  }
  ngAfterViewInit(): void{
    this.basemap = this.basemapService.getCurrentBasemap();
    this.markerLayer = new OlOverlay({});
    this.markerZoom = new OlView({ projection: this.basemapService.getBaseMapProjection() });
    this.pointerContainer.nativeElement.style.transform = 'rotate(' + this.defaultAngle + 'deg)';
  }
  ngOnChanges(changes: { [propkey: string]: SimpleChange }): void{
    console.log(changes);
    if (changes.showCompass) {
      console.log('IN SHOW COMPASS ');
      if (changes.showCompass.currentValue) {
        this.setIconToSelectLocationInMap();
      }
    }
    if (changes.hideCompass) {
      console.log('IN HIDE COMPASS ');
      if (changes.hideCompass.currentValue) {
        this.close();
      }
    }

    // if(changes.coOrds){
    //   if(!changes.coOrds.firstChange){
    //     this.setCompassToLayer();
    //   }
    // }
  }
  setAnimation(): void{
    // -webkit-animation: rotate 1s cubic-bezier(1, 0.2, 0.5, 1) infinite alternate;
    // animation: rotate 1s cubic-bezier(1, 0.2, 0.5, 1) infinite alternate;
    // -moz-animation: rotate 1s cubic-bezier(1, 0.2, 0.5, 1) infinite alternate;
    // -o-animation: rotate 1s cubic-bezier(1, 0.2, 0.5, 1) infinite alternate;
    this.comPointer.nativeElement.className = 'cursor-animation';
  }
  removeAnimation(): void{
    this.comPointer.nativeElement.className = '';
  }
  setAngle(angle): void{
    this.removeAnimation();
    const setAngle = this.defaultAngle + angle;
    this.pointerContainer.nativeElement.style.transform = 'rotate(' + setAngle + 'deg)';
  }
  refreshData(): void{
    this.setAnimation();
    this.locationInfo = 'Loading...';
    setTimeout(() => {
      this.getMagneticDeclination(this.lat1, this.lon1);
    }, 2000);
  }
  getMagneticDeclination(lat, long): any{
    console.log('IN getMagneticDeclination');
    console.log(lat);
    console.log(long);
    this.locationInfo = 'Loading...';
    const url = 'https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=' + lat + '&lon1='
    + long + '&resultFormat=json&startMonth=' + new Date().getMonth();
    return this.http.get(url)
          .subscribe( ( result: any ) => {
            console.log('GOT MAGNETIC DECLINATION');
            console.log(result);
            const resArray = result.result;
            let resObj: any = {};
            if (resArray.length > 0) {
              resObj = resArray[0];
            }
            if (this.commonService.isValid(resObj.declination)) {
              this.magneticDeclination = resObj.declination;
            } else {
              this.magneticDeclination = 0;
            }
            const latToShow = Number(lat).toFixed(2);
            const longToShow = Number(long).toFixed(2);
            const declinationToShow = Number(resObj.declination).toFixed(2);
            this.locationInfo = 'Lat: ' + latToShow + ', Lon: ' + longToShow + ', Declination: ' + declinationToShow;
            this.setAngle(this.magneticDeclination);
          },
          error => {
            console.log('ERROR WHILE GETTING MAGNETIC DECLINATION');
            console.log(error);
          });
  }
  setCompassToLayer(): void{
    this.compassContainer.nativeElement.style.display = 'block';
    console.log(this.compassContainer.nativeElement);
    this.markerLayer.setPosition([this.lon1, this.lat1]);
    this.markerLayer.setElement(this.compassContainer.nativeElement);
    // this.markerZoom.setCenter([Number(this.lon1), Number(this.lat1)]);
      // this.markerZoom.setZoom(this.basemap.getView().getZoom());
      // this.basemap.setView(this.markerZoom);
    this.basemap.addOverlay(this.markerLayer);
  }
  close(): void{
    console.log('IN CLOSE');
    this.compassContainer.nativeElement.style.display = 'none';
    this.closeMarker();
    this.compassClosed.emit(String(new Date().getTime()));
    this.unSetIconToSelectLocationInMap();
  }
  closeMarker(): void{
    console.log('IN closeMarker');
    const id = 'notepad_loc_marker'; // +idTime;
    try {
      // if (document.getElementById(id)) {
      //   document.getElementById(id).remove();
      // }
      this.basemap.removeOverlay(this.markerLayer);
    } catch (e) {
      console.log(e);
    }
  }


  setIconToSelectLocationInMap(): void{
    console.log('IN  setIconToSelectLocationInMap');
    console.log(this);
    this.unSetIconToSelectLocationInMap();

    this.basemapService.setMouseIcon(this.locationClickIcon);
    this.listener = this.basemap.on('singleclick', (evt) => {
      console.log(evt);
      // const coord = [evt.coordinate[1], evt.coordinate[0]];
      this.coord = [evt.coordinate[1].toFixed(5), evt.coordinate[0].toFixed(5)];
      this.lat1 = this.coord[0];
      this.lon1 =  this.coord[1];
      // this.positionMarkObserver.next({ 'co-ordinates': this.coord, 'event': evt });
      this.setCompassToLayer();
      this.refreshData();
      setTimeout(() => {
        this.unSetIconToSelectLocationInMap(false);
      }, 500);
    });
  }
  unSetIconToSelectLocationInMap(closeMarker = true): void{
    // console.log('called deactivateTool', this._toolRef);
    try{
      console.log(this.basemap);
      this.basemapService.setMouseIcon('auto');
      unByKey(this.listener);
      console.log(this);
      this.listener = null;
      this.basemap.removeEventListener('singleclick');
      if (closeMarker) {
        // this.closeMarker('');
      }
    } catch (e) {
      console.log(e);
    }

  }

}

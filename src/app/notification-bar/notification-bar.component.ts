import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import OlMap from 'ol/Map';

import { BasemapService } from '../basemap/basemap.service';
import { AuthObservableService } from '../Services/authObservableService';
import { CommonService } from '../Services/common.service';
import {
  NgbModalConfig,
  NgbModal,
  ModalDismissReasons,
} from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { transform } from 'typescript';
import { source } from '@angular-devkit/schematics';
// import proj4 from 'proj4';
// import { register } from 'ol/proj/proj4.js';
import { get as getProjection } from 'ol/proj.js';


declare var google: any;
const proj4326 = getProjection('EPSG:4326');

@Component({
  selector: 'app-notification-bar',
  templateUrl: './notification-bar.component.html',
  styleUrls: ['./notification-bar.component.scss'],
})
export class NotificationBarComponent implements OnInit, AfterViewInit {
  basemap: OlMap;
  currentUploadLayerName = 'Upload Status';
  currentUploadProgress = 0;

  leftDisabled = false;
  rightDisabled = false;
  leftArrowHide = false;
  rightArrowHide = false;
  scrollDivId = 'scrollDivId';
  curserPosition = 'Unknown';
  elevationVal: Array<string> = [];
  markedLocationCoOrds: Array<string> = [];
  showCoOrdsCopiedMsg: boolean;
  northRotateValue = '0';
  isGuest = true;
  activeBaseLayerName = 'Open Street';
  currentReferenceSystem = ' ';
  currentViewFactory = '';
  termsShown: boolean;
  tcAndPrivacyActivePage = 'tc';
  orgName = '';
  currentUploadStatus = '';

  @ViewChild('appInfoContent') appInfoContentDiv: HTMLElement;
  sourceproj: any;

  // @Input() exportcordsysname: string;

  constructor(
    private basemapService: BasemapService,
    private authObsr: AuthObservableService,
    private router: Router,
    private modalService: NgbModal,
    private commonService: CommonService
  ) {
    if (this.commonService.isValid(localStorage.getItem('token'))) {
      this.isGuest = false;
    } else {
      this.isGuest = true;
    }
    this.authObsr.subscribeForAuthStatus(
      'NotificationBarComponent',
      (authRes, msg) => {
        if (authRes.status === 'success') {
          this.isGuest = false;
        } else if (authRes.status === 'failed') {
          this.isGuest = true;
        }
      }
    );
    this.authObsr.subscribeForLayerUploadStatus(
      'NotificationBarComponent',
      (data) => {
        console.log('RECEIVED Layer STATUS...');
        console.log(data);
        if (this.currentUploadStatus !== 'DUPLICATE') {
          this.currentUploadProgress = Number(data.progress);
          console.log('STATUS : ', this.currentUploadStatus);
          if (String(data.status).toLowerCase().includes('duplicate')) {
            this.currentUploadStatus = 'DUPLICATE';
            this.currentUploadProgress = 0;
            setTimeout(() => {
              this.currentUploadStatus = '';
            }, 10000);
          }
        }
      }
    );
    this.authObsr.subscribeToGetBaseLayerName(
      'NotificationBarComponent',
      (data) => {
        // console.log('RECEIVED Base layer name...');
        // console.log(data);
        this.activeBaseLayerName = data;
      }
    );
    this.authObsr.subscribeToGetReferenceSystem(
      'NotificationBarComponent',
      (data) => {
        console.log('RECEIVED reference system name...', data);
        // console.log(data);
        this.currentReferenceSystem = data.name;
      }
    );

    this.authObsr.subscribeToGetViewFactory(
      'NotificationBarComponent',
      (data) => {
        // console.log('RECEIVED View factory name...');
        // console.log(data);
        this.currentViewFactory = data;
      }
    );

    this.authObsr.subscribeForOrgName('NotificationBarComponent', (data) => {
      // console.log('RECEIVED View factory name...');
      // console.log(data);
      this.orgName = '(' + data + ')';
    });

    this.authObsr.subscribeForTermsPage('NotificationBarComponent', (data) => {
      // console.log('RECEIVED subscribeForTermsPage...');
      // console.log(data);
      if (data === 'terms') {
        this.tcAndPrivacyActivePage = 'tc';
      } else {
        this.tcAndPrivacyActivePage = 'privacy';
      }
      this.showApplicationTerms('', this.appInfoContentDiv);
    });
  }

  ngOnInit(): void {
    this.basemap = this.basemapService.getCurrentBasemap();
    console.log('Subscribed for pointer move...');

    this.basemap.getView().on('change:rotation', () => {
      // console.log('fired ', this.basemap.getView().getRotation());
      try {
        this.northRotateValue = (
          this.basemap.getView().getRotation() /
          (Math.PI / 180)
        ).toFixed(2);
      } catch (e) {
        console.log(e);
      }
    });

    this.basemap.on('pointermove', (evt) => {
      var coord = [
        evt.coordinate[0].toFixed(4),
        evt.coordinate[1].toFixed(4),
      ];
      // this.curserPosition = coord;
      this.curserPosition = `${coord[0]}, ${coord[1]},`;

      //console.log("check coord",coord);
    //   var stringArray = [];

    //  var source = this.basemapService.getSourceProjection;
    //   var test = this.currentReferenceSystem;
    //   console.log(test, 'testtt');
    //   var sourceCrs = getProjection(test);
    //   console.log(sourceCrs, 'checksourceprojection');
    //   var projection = this.sourceproj
     
    //   const transformed_Coordinates =
    //     this.basemapService.getTransformedCoordinates(
    //       coord,
    //       sourceCrs,  
    //       proj4326
    //     );
    //         console.log(sourceCrs, 'checksourceproj');

    //   console.log(transformed_Coordinates, 'checktransformedcoord');
    //   console.log(transformed_Coordinates, coord, 'checkdiff');
    //   for (let i = 0; i < transformed_Coordinates.length - 1; i++) {
    //     stringArray.push(
    //       `${transformed_Coordinates[1].toFixed(4)}`,
    //       `${transformed_Coordinates[0].toFixed(4)}`
    //     );
    //   }
    //   console.log(stringArray, coord, 'checkstringarrAY');

    //   // New code of Elevation Service
    //   const elevator = new google.maps.ElevationService();
    //   const location = new google.maps.LatLng(
    //     stringArray[0],
    //     stringArray[1]
    //     // coord[1],
    //     // coord[0]
    //   ); // { "lat": 39.7391536, "lng": -104.9847034 }
    //   console.log('checkeleval', location, coord);
    //   elevator
    //     .getElevationForLocations({
    //       locations: [location],
    //     })

    //     .then(({ results }) => {
    //       console.log('locationrresults. ', results);
    //       // Retrieve the first result
    //       if (results[0]) {
    //         // Open the infowindow indicating the elevation at the clicked position.
    //         console.log(
    //           'The elevation at this point is ' + results[0].elevation
    //         );
    //         this.elevationVal = results[0].elevation.toFixed(2);
    //         return results;
    //       } else {
    //         console.log('No results found');
    //       }
    //     })
    //     .catch((e) => console.log('Elevation service failed due to: ' + e));
    });

    this.basemap.on('contextmenu', (evt) => {
      console.log(evt);
      this.copyCoOrds(evt);
      evt.preventDefault();
    });
  }

  copyCoOrds(evt): void {
    console.log(evt,"check the evt")
    const coord = [evt.coordinate[1].toFixed(4), evt.coordinate[0].toFixed(4)];
    console.log('checkcopycords', coord);

    if (
      this.commonService.isValid(document.getElementById('coOrdCopyOnclickMap'))
    ) {
      document.getElementById('coOrdCopyOnclickMap').remove();
    }
    const p = document.createElement('input');
    p.id = 'coOrdCopyOnclickMap';
    p.type = 'text';
    // p.setAttribute('style', 'display: none');
    p.value = coord.toString();
    document.body.appendChild(p);
    p.select();
    p.setSelectionRange(0, 99999);
    document.execCommand('copy');
    // p.remove();
    this.markedLocationCoOrds = coord;
    this.showCoOrdsCopiedMsg = true;
    setTimeout(() => {
      this.showCoOrdsCopiedMsg = false;
    }, 3000);
  }

  ngAfterViewInit(): void {
    this.showOrHideArrows();
  }

  scrollLeft(e): void {
    // console.log("scrollLeft");
    const elmnt = document.getElementById(this.scrollDivId);
    const totalWidth = elmnt.scrollWidth;
    const currentWidth = document.getElementById(this.scrollDivId).clientWidth; // $('#'+this.scrollDivId).width();
    const curr = document.getElementById(this.scrollDivId).scrollLeft; // $('#'+this.scrollDivId).scrollLeft();
    let scrollWidth = 0;
    if (totalWidth - currentWidth >= 100) {
      scrollWidth = 100;
    } else {
      scrollWidth = totalWidth - currentWidth;
    }
    // console.log("WIDTH : ",currentWidth);
    // console.log("SCROLL WIDTH : ",scrollWidth);
    if (curr === 0) {
      /// disable this button
      this.leftDisabled = true;
    } else {
      this.leftDisabled = false;
      // $('#'+this.scrollDivId).scrollLeft(curr-100); //$('#scrollDivId').scrollLeft(curr-100);
      document.getElementById(this.scrollDivId).scrollLeft = curr - 100;
      // $('#scrollDivId').animate({scrollLeft:curr-100},500);
      // curr =  $('#scrollDivId').scrollLeft();
      this.enableDisableLeftArrow();
    }
    this.enableDisableRightArrow();
    // console.log("LEFT DISABLED : ",this.leftDisabled);
    // console.log("RIGHT DISABLED : ",this.rightDisabled);
  }
  enableDisableLeftArrow(): void {
    // if($('#scrollDivId').scrollLeft()<=3)
    // if($('#'+this.scrollDivId).scrollLeft()<=3)
    if (document.getElementById(this.scrollDivId).scrollLeft <= 3) {
      this.leftDisabled = true;
    } else {
      this.leftDisabled = false;
    }
  }
  scrollRight(e): void {
    // console.log("scrollRight");
    let elmnt;
    elmnt = document.getElementById(this.scrollDivId);
    const totalWidth = elmnt.scrollWidth;
    const currentWidth = document.getElementById(this.scrollDivId).clientWidth; // $('#'+this.scrollDivId).width()

    const curr = document.getElementById(this.scrollDivId).scrollLeft; // $('#'+this.scrollDivId).scrollLeft();
    // console.log("WIDTH : ",currentWidth);

    // console.log("CURR : ",curr);
    let scrollWidth = 0;
    if (totalWidth - (currentWidth + curr) >= 100) {
      scrollWidth = 100;
    } else if (totalWidth - (currentWidth + curr) < 100) {
      scrollWidth = totalWidth - (currentWidth + curr);
    }
    if (totalWidth - (currentWidth + curr) <= 5) {
      // console.log("WIDTH VERY SMALL");
      // disable this button
      this.rightDisabled = true;
    } else {
      // console.log("WIDTH LARGE");
      this.rightDisabled = false;
      // $('#'+this.scrollDivId).scrollLeft(curr+100);
      document.getElementById(this.scrollDivId).scrollLeft = curr + 100;
      // $('#scrollDivId').animate({scrollLeft:curr+100},500);
      // curr =  $('#scrollDivId').scrollLeft();
      this.enableDisableRightArrow();
    }
    this.enableDisableLeftArrow();
    // console.log("LEFT DISABLED : ",this.leftDisabled);
    // console.log("RIGHT DISABLED : ",this.rightDisabled);
  }
  functionClick(e){
   // localStorage.setItem(`projCode`,`EPSG:${e}`)
    var projectioncodee = `${`EPSG:${e}`}` 
    console.log(projectioncodee,"fdghhhhhhh")
    this.sourceproj = getProjection(projectioncodee)
    console.log(this.sourceproj,'checkevalue')
  }

  enableDisableRightArrow(): void {
    let elmnt;
    // elmnt = document.getElementById("scrollDivId");
    elmnt = document.getElementById(this.scrollDivId);
    const totalWidth = elmnt.scrollWidth;
    const currentWidth = document.getElementById(this.scrollDivId).clientWidth; // $('#'+this.scrollDivId).width()

    const curr = document.getElementById(this.scrollDivId).scrollLeft; // $('#'+this.scrollDivId).scrollLeft();
    // console.log("WIDTH : ",currentWidth);

    // console.log("CURR : ",curr);
    let scrollWidth = 0;
    if (totalWidth - (currentWidth + curr) >= 100) {
      scrollWidth = 100;
    } else if (totalWidth - (currentWidth + curr) < 100) {
      scrollWidth = totalWidth - (currentWidth + curr);
    }
    if (totalWidth - (currentWidth + curr) <= 5) {
      this.rightDisabled = true;
    } else {
      this.rightDisabled = false;
    }
  }
  showOrHideArrows(): void {
    this.enableDisableLeftArrow();
    this.enableDisableRightArrow();
    // console.log("LEFT DISABLED : ",this.leftDisabled);
    // console.log("RIGHT DISABLED : ",this.rightDisabled);
    if (this.leftDisabled && this.rightDisabled) {
      this.leftArrowHide = true;
      this.rightArrowHide = true;
    } else {
      this.leftArrowHide = false;
      this.rightArrowHide = false;
    }
    document.getElementById(this.scrollDivId).scrollLeft = 0;
  }
  @HostListener('window:resize', ['$event'])
  onResize(e): void {
    this.showOrHideArrows();
  }

  showApplicationTerms(event, content): any {
    this.termsShown = !this.termsShown; // true;
    console.log(this.router.url);
    if (this.termsShown) {
      this.modalService
        .open(content, { ariaLabelledBy: 'modal-basic-title' })
        .result.then(
          (result) => {
            console.log(`Closed with: ${result}`);
          },
          (reason) => {
            console.log(reason);
            console.log(this.router.url);
            let url = this.router.url;
            if (url.includes('#')) {
              url = url.substr(0, url.lastIndexOf('#'));
            }
            this.router.navigate([url], { replaceUrl: true });
            this.termsShown = false;
            // this.resetSelectedOption();
            // this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
          }
        );
    } else {
      this.modalService.dismissAll();
    }
  }
}

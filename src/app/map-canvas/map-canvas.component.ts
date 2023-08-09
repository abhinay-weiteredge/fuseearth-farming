import { AfterViewInit, Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthObservableService } from '../Services/authObservableService';
import { CommonService } from '../Services/common.service';
import { GeobaseService } from '../Services/geobase.service';
import { BasemapService } from '../basemap/basemap.service';
import { TopicsService } from '../Services/topics.service';
import { SocialAuthService } from '../Services/socialAuthService';
import { CustomSpinner } from '../Services/SpinnerService';
import { jsPDF } from 'jspdf';


@Component({
  selector: 'app-map-canvas',
  templateUrl: './map-canvas.component.html',
  styleUrls: ['./map-canvas.component.scss']
})
export class MapCanvasComponent implements OnInit, AfterViewInit {

  showCapture = false;
  show = false;
  closeNotepad = '';
  markGeopadLocation: boolean;
  showGeoSession: boolean;
  closeGeoSession: string;
  params: any = {};
  sessionId: Number = 0;
  uuid = '';
  isGuest = true;
  sessionDataCollected: boolean;
  currentSession: any = {};
  isDefault = true;
  globalObject = {
    geobase: {},
    pageType: '',
    sessionShare: {}
  };
  showOrHideUserLoginMenu = '';
  showCaptureExpandedView: string;
  showSessionExpandedView: string;
  viewMode: any = {};
  userInfo: any = {};
  // {
  //   type: /*'INDEPENDENT', /*/ 'ORG',
  //   orgName: 'xyz',
  //   orgId: '123434324'
  // };

  pageTypes = {
    SHARE: 'share',
    SESSION: 'session',
    COVID19: 'COVID19',
    DEFAULT: 'default'
  };
  mapProjectionUnits = '500 nm';
  scaleLineWidth = 0;
  showCovidInfo = false;
  showCovidInfoLegend = true;

  infoNameAndColors: any[] = [
    { name: 'Oxygen', color: 'red' },
    { name: 'Blood', color: 'orange' },
    { name: 'Plasma', color: 'yellow' },
    { name: 'Hospital', color: 'green' },
    { name: 'Medicines', color: 'blue' },
    { name: 'Food', color: 'indigo' },
    { name: 'Vaccination', color: '#607d8b' },
    { name: 'Others', color: 'violet' }
  ];
  playCovidInfoVideo = false;
  loggedInUserProfile: any = {};
  currentPage = '';
  pageIcon = '';
  pageTitle = '';
  showFeSplashScreen = true;
  showUserLoginAlert = false;
  inputText = 'Please Login to view Session.';
  showAsModal = false;
  clickedOnMap = '';
  triggerAnnotation = '';

  constructor(
    private obsr: AuthObservableService, private actRoute: ActivatedRoute,
    private geobaseService: GeobaseService, private router: Router,
    private firebaseAuth: SocialAuthService, private spinner: CustomSpinner,
    private commonService: CommonService, private authObsr: AuthObservableService,
    private basemapService: BasemapService, private topicService: TopicsService) {
    this.params = this.actRoute.snapshot.params;
    console.log('params and url ', this.params, this.router.url);
    this.spinner.hide();
    this.geobaseProcess();
    this.authObsr.subscribeForAuthStatus('MapCanvasComponent', (authRes, msg) => {
      console.log('LOGIN STATUS CHANGED');
      console.log(authRes);
      console.log(msg);
      if (authRes.status === 'success') {
        this.isGuest = false;
        // this.getUserInfo();
        // this.getGeobase(0, true);
        this.showFeSplashScreen = false;
        this.geobaseProcess();
      } else if (authRes.status === 'failed') {
        this.isGuest = true;
        this.showGeoSession = false;
        if (String(this.router.url).includes('share')) {
          this.showUserLoginAlert = true;
          this.inputText = 'Please Login to view Session.';
        }
      }
    });
  }
  @HostListener('window:keydown', ['$event'])
  /* escapeKeyPressed(event: KeyboardEvent) {
    console.log('tab clicked, prit pdf', event);
    this.downloadPDF();
  } */
  onKeyDown(event: KeyboardEvent) {
    // console.log('clicked on event ', event);
    /* if ((event.metaKey || event.ctrlKey) && event.key === 'q') {
      // console.log('clicked on event ctrl+q', event);
        this.downloadPDF();
    } */
  }

  geobaseProcess(): any {
    if (this.commonService.isValid(this.params.sessionId) && this.commonService.isValid(this.params.uuid)) {
      this.sessionId = Number(this.params.sessionId);
      this.sessionId = +(this.params.sessionId);
      this.uuid = this.params.uuid;
      console.log('Got session id &&  uuid', this.sessionId, this.uuid);
      // Here calling getGeobase of sessionId & uuid & default is false
      this.getSharedGeobase(this.sessionId, this.uuid);
      this.globalObject.pageType = this.pageTypes.SHARE; // 'share';
    } else if (this.commonService.isValid(this.params.sessionId) && String(this.router.url).includes('share')) {
      this.sessionId = Number(this.params.sessionId);
      this.sessionId = +(this.params.sessionId);
      this.isDefault = false;
      console.log('Got session id in sharing URL not UUid', this.sessionId, this.isDefault, this.isGuest);
      // Here calling the getGeobase of sessionId and default is false
      this.getSharedGeobase(this.sessionId, this.uuid);
      this.globalObject.pageType = this.pageTypes.SHARE; // 'session';
    } else if (this.commonService.isValid(this.params.sessionId)) {
      this.sessionId = this.params.sessionId;
      this.isDefault = false;
      console.log('Got session id', this.sessionId, this.isDefault);
      // Here calling the getGeobase of sessionId and default is false
      this.globalObject.pageType = this.pageTypes.SESSION; // 'session';
    } else if (String(this.router.url).includes('covid')){
      const geobaseInfo = {
        sessionId : 127,
        organizationId : 5,
        geopadId : 105,
        towerId : 178,
        owner : 44,
        isPublic : false,
        boundingBox : null,
        isDefault : true,
        name : 'Geobase_default',
        geobaseUuid : '55bb4d72-c591-42df-bdd2-2eae919a1632',
        status : 'ACTIVE',
        public : false,
        default : true,
        showAllSites: false,
      };
      this.currentSession = geobaseInfo;
      this.currentSession.status = 'completed';
      this.sessionDataCollected = true;
      this.globalObject.geobase = geobaseInfo;

      this.isDefault = false;
      this.sessionId = 127;
      console.log('COVID19 special page...', this.isDefault, this.sessionId);
      console.log(this);
      this.globalObject.pageType = this.pageTypes.COVID19; // 'covid19';
      console.log(this.globalObject);
      console.log(JSON.stringify(this.globalObject));
    } else {
      this.isDefault = true;
      this.sessionId = 0;
      console.log('No session id & uuid', this.sessionId, this.isDefault);
      this.globalObject.pageType = this.pageTypes.DEFAULT; // 'default';
    }
    if (this.commonService.isValid(localStorage.getItem('token'))) {
      // Here calling the getGeobase of default is true
      this.isGuest = false;
      this.getUserInfo();
      this.getProfileData();
      this.showFeSplashScreen = false;
      // this.getDefaultGeobase();
      if (!this.commonService.isValid(this.params.uuid) && !(String(this.router.url).includes('share')) &&
          this.globalObject.pageType !== this.pageTypes.COVID19) {
        this.getGeobase(this.sessionId, this.isDefault);
      }
    } else {
      // Here no user login..
      this.isGuest = true;
    }
  }

  getProfileData(): void{
    console.log('IN getProfileData');
    this.firebaseAuth.getProfileData()
          .subscribe(result => {
            console.log('GOT PROFILE');
            console.log(result);
            this.loggedInUserProfile = result;
          }, error => {
            console.log('ERROR WHILE GETTING PROFILE DATA');
            console.log(error);
          });
  }

  getUserInfo(): void{
    this.topicService.getUserInfo()
          .subscribe(res => {
            console.log('GOT USER INFO');
            console.log(res);
            this.storeUserInfo(res);
          }, error => {
            console.log('ERROR WHILE GETTING USER INFO');
            console.log(error);
          });
  }

  storeUserInfo(res): void{
    let type = '';
    if (res.name === 'FuseEarth') {
      type = 'INDEPENDENT';
      this.obsr.updateOrgName('Individual');
    } else {
      type = 'ORG';
      this.obsr.updateOrgName(res.name);
    }
    if (this.globalObject.pageType !== this.pageTypes.COVID19) {
      this.userInfo = {
        type, // 'INDEPENDENT', // 'ORG',
        orgName: res.name,
        orgId: res.organizationId // '123434324'
      };
    } else {
      this.userInfo = {
        type: 'ORG',
        orgName: 'Geobase_default',
        orgId: 5 // '123434324'
      };
    }
  }
  ngOnInit(): any {
    setTimeout(() => {
      if (this.globalObject.pageType !== this.pageTypes.COVID19) {
        this.show = true;
      }
    }, 1000);
  }

  ngAfterViewInit(): void{
    if (this.globalObject.pageType === this.pageTypes.COVID19) {
      setTimeout(() => {
        this.showGeopadWindowFun({data: 'geopad', event: {ctrlKey: false} });
        this.show = true;
        // this.basemapService.getCurrentBasemap().getLayers().forEach(layer => {
        //   if (layer.values_.name === 'satellite' || layer.values_.name === 'terrain'
        //   || layer.values_.name === 'toner' || layer.values_.name === 'bingsatellite') {
        //     layer.setVisible(false);
        //   } else if (layer.values_.name === 'openstreet') {
        //     layer.setVisible(true);
        //   }
        // });
        // this.basemapService.getCurrentBasemap().getView().setCenter([78.9629, 20.5937]);
        // this.basemapService.getCurrentBasemap().getView().setZoom(7);
        this.basemapService.getCurrentBasemap().on('moveend', (e) => {
          // console.log(e);
          this.getMapProjectionUnits();
          this.getScaleLineWidth();
          // this.basemapService.setLoadScaleLine();
        });
        // setTimeout(() => {
        //   this.basemapService.userLocation();
        //   this.basemapService.getCurrentBasemap().getView().setZoom(17);
        // }, 10000);
      }, 1000);
    }
  }
  toggleAwareness(event): void{
    this.viewMode = event;
  }
  showGeopadWindowFun(event): any {
    this.viewMode = {
      mode: 'capture',
      show: true,
      timestamp: new Date().getTime(),
      from: 'geopad',
      op: ''
    };
    if (event.data === 'geopad') {
      if (this.showCapture) {
        this.showCaptureExpandedView = String(new Date().getTime());
      }
      this.showCapture = true;
    }
    if (event.event.ctrlKey && event.data === 'geopad') {
      this.markGeopadLocation = true;
    } else {
      this.markGeopadLocation = false;
    }
    if (event.data === 'annotate') {
      // this.viewMode.from = event.data;
      // this.currentSession.showAllSites = false;
      // this.showCapture = true;
      this.triggerAnnotation = new Date().getTime().toString();
    }
  }
  saveAnnotationFun(event): void{
    this.viewMode = {
      mode: 'capture',
      show: true,
      timestamp: new Date().getTime(),
      from: 'annotate',
      op: '',
      coords: event.coords,
      features: event.features
    };
    this.currentSession.showAllSites = false;
    this.showCapture = true;
  }
  showGeoSessionWindowFun(event): any {
    if (event.data === 'geosession') {
      if (this.showGeoSession) {
        this.showSessionExpandedView = String(new Date().getTime());
      }
      this.showGeoSession = true;
    }
  }
  closeCaptureWindow(): any {
    this.showCapture = false;
    this.markGeopadLocation = false;
    this.closeNotepad = String(new Date().getTime());
    this.viewMode = {
      mode: '',
      show: false,
      timestamp: new Date().getTime(),
      from: 'geopad',
      op: ''
    };
    this.currentSession.showAllSites = false;
  }
  loadSessionFun(event): void{
    console.log('Load Session');
    console.log(event);
    this.globalObject.geobase = event;
    this.currentSession = event;
    this.currentSession.status = 'completed';
  }
  closeGeoSessionWindow(): any {
    this.showGeoSession = false;
    this.closeGeoSession = String(new Date().getTime());
  }

  validtingShareByMeAndShareWithMeSessionsList(sessionId, isValidUser, filterName, isFinalCall): any {
    this.geobaseService.getSharedGeobaseNew(filterName, sessionId)
    .subscribe(geobaseList => {
      console.log('Got geobaseList info in filter', geobaseList, localStorage, localStorage.getItem('email'));
      console.log(this);
      if (this.commonService.isValid(geobaseList)) {
        console.log('geobaseList present');
        if (geobaseList.body.length > 0) {
          geobaseList.body.forEach(geobase => {
            console.log(geobase);
            console.log(geobase.session.sessionId, sessionId, typeof(sessionId), typeof(geobase.session.sessionId));
            geobase.session.sessionId = Number(geobase.session.sessionId);
            geobase.session.sessionId = +(geobase.session.sessionId);
            geobase.session.showAllSites = false;
            if (sessionId === geobase.session.sessionId){
              if (geobase.sessionShare !== null) {
                if ((localStorage.getItem('email') === geobase.sessionShare.recipientUserEmail) ||
                (localStorage.getItem('email') === geobase.sessionShare.senderUserEmail)) {
                  isValidUser = true;
                  geobase.session.sessionId = Number(geobase.session.sessionId);
                  geobase.session.sessionId = +(geobase.session.sessionId);
                  this.currentSession = geobase.session;
                  this.currentSession.status = 'completed';
                  this.sessionDataCollected = true;
                  // this.globalObject.geobase = geobase.session;
                  this.globalObject.geobase = this.commonService.isValid(geobase.session) ? geobase.session : {};
                  this.globalObject.sessionShare = this.commonService.isValid(geobase.sessionShare) ? geobase.sessionShare : {};
                  console.log('global Object is ', this.globalObject, this.currentSession);
                  if (geobase.session.boundingBox !== null) {
                    console.log('Bounding box is ', geobase.session.boundingBox);
                    this.basemapService.getCurrentBasemap().getView().fit(geobase.session.boundingBox.map(Number));
                  }
                  return true;
                }
              }
            }
          });
        }
      }
      if (!isValidUser) {
        if (!isFinalCall) {
          this.validtingShareByMeAndShareWithMeSessionsList(sessionId, false, 'shareByMe', true);
        } else {
          this.showUserLoginAlert = true;
          this.inputText = 'You currently dont have the permission to view this session.';
        }
      // this.showUserLoginAlert = true;
      // this.inputText = 'You currently dont have the permission to view this session.';
      // window.alert('You currently dont have the permission to view this session');
      // window.open('https://qa.fuse.earth/', "_self");
    }
      return false;
    }, error => {
      console.log('Error while getting shared geobaseinfo');
      console.log(error);
      if (error.errorCode === 500) {
      }
      if (error.status === 403 && error.statusText === 'Forbidden') {
        if (String(this.router.url).includes('share')) {
          this.showUserLoginAlert = true;
          this.inputText = 'Please Login to view Session.';
        }
      }
      this.currentSession.status = 'failed';
      this.sessionDataCollected = true;
    });
    return false;
  }

  getSharedGeobase(sessionId, uuid): any {
    // its new API
    const isValidUser = false;
    this.validtingShareByMeAndShareWithMeSessionsList(sessionId, isValidUser, 'shareWithMe', false);
    /* const shareByMeStatus = this.validtingShareByMeAndShareWithMeSessionsList(sessionId, isValidUser, 'shareWithMe');
    const shareWithMeStatus = this.validtingShareByMeAndShareWithMeSessionsList(sessionId, isValidUser, 'shareByMe');
    console.log(shareByMeStatus, shareWithMeStatus);
    if(shareByMeStatus || shareWithMeStatus) {
      isValidUser = true;
    } else {
      this.showUserLoginAlert = true;
      this.inputText = 'You currently dont have the permission to view this session.';
    } */
  }

  getGeobase(sessionId, isDefault): void {
    console.log('getting the geobase in mapCanvas', sessionId, isDefault);
    this.sessionDataCollected = false;
    this.currentSession.status = 'loading';
    this.geobaseService.getGeobase(sessionId, isDefault)
      .subscribe(geobaseInfo => {
        console.log('Got geobaseInfo info in mapCanvas');
        console.log(geobaseInfo);
        if (!this.commonService.isValid(geobaseInfo)) {
          console.log('No geobase info present in mapCanvas');
          this.geobaseService.createGeobaseTowerGeopad()
            .subscribe(resultSession => {
              const result = resultSession.body;
              console.log('result of saving the new geobase with tower & geopad', result);
              if (!this.commonService.isValid(result)) {
                console.log('New session not created');
              } else {
                console.log('New session created');
                result.showAllSites = false;
                this.currentSession = result;
                this.globalObject.geobase = {};
                this.sessionDataCollected = true;
              }
              this.currentSession.status = 'completed';
            }, error => {
              console.log('Error while creating new geobase session');
              console.log(error);
              if (error.errorCode === 500) {
              }
              this.currentSession.status = 'completed';
              this.sessionDataCollected = true;
            });
        } else {
          geobaseInfo.showAllSites = false;
          this.currentSession = geobaseInfo;
          this.currentSession.status = 'completed';
          this.sessionDataCollected = true;
          this.globalObject.geobase = this.commonService.isValid(geobaseInfo) ? geobaseInfo : {};
          if (geobaseInfo.boundingBox !== null) {
            console.log('Bounding box is ', geobaseInfo.boundingBox);
            this.basemapService.getCurrentBasemap().getView().fit(geobaseInfo.boundingBox.map(Number));
          }
        }
      }, error => {
        console.log('Error while getting workspace');
        console.log(error);
        if (error.errorCode === 500) {
        }
        this.currentSession.status = 'failed';
        this.sessionDataCollected = true;
      });
  }

  pageClickEventfun(event): any {
    this.showOrHideUserLoginMenu = event;
  }

  pageClickEventOnMap(event): any {
    this.clickedOnMap = event;
    this.showOrHideUserLoginMenu = event;
  }


  /***********
   *
   * FOR COVID PAGE
   *
   */
  getMapProjectionUnits(): any {
    this.basemapService.getCurrentBasemap().controls.forEach(control => {
      if (this.commonService.isValid(control.values_)) {
        if (control.values_.units !== undefined) {
          setTimeout(() => {
            // console.log('Here scal line ', control, control.renderedHTML_, control.element.innerText);
            this.mapProjectionUnits = this.setMapProjectionUnits(control.element.innerText);
          }, 1000);
        }
      }
    });
  }
  setMapProjectionUnits(val): any {
    const tempArr = val.split(' ');
    if (tempArr.length > 1) {
      // Here adding new code for view factory related
      const scaleLine = tempArr[3].match(/\d+/g);
      const scalByHalf = Number(scaleLine) / 2;
      const value = tempArr[2].slice(0, tempArr[2].length - (scalByHalf.toString().length)).slice(0, -1); // .replace(/\,/g, '');
      // console.log(tempArr, ' :: ', scaleLine, ' : ', value);
      const viewFactory = tempArr[0] + tempArr[1] + value;
      this.authObsr.updateViewFactory(viewFactory);
      if (scaleLine.includes('.')) {
        let fixedNum = scaleLine.substr(scaleLine.indexOf('.') + 1).length;
        // console.log(fixedNum);
        if (fixedNum > 5) {
          // console.log('MORE THAN 5. SETTING TO 5');
          fixedNum = 5;
        }
        return String(Number(scaleLine).toFixed(fixedNum)) + ' ' + tempArr[4];
      } else {
        return scaleLine + ' ' + tempArr[4];
      }
    } else {
      return val;
    }
  }
  getScaleLineWidth(): any {
    setTimeout(() => {
      try {
        const mapControlCollection: any[] = this.basemapService.getCurrentBasemap().getControls().array_;
        // console.log(mapControlCollection);
        mapControlCollection.forEach(element => {
          // console.log(element);
          // console.log(element.renderedWidth_);
          if (this.commonService.isValid(element.renderedWidth_)) {
            this.scaleLineWidth = element.renderedWidth_;
          }
        });
        console.log('SCALE LINE WIDTH : ', this.scaleLineWidth);
      } catch (e) {
        console.log(e);
      }
    }, 1000);
  }

  zoomIn(): any {
    // console.log(this.basemapService.getCurrentBasemap().getView());
    // console.log(this.basemapService.getCurrentBasemap().getView().getZoom());
    const currentZoom = this.basemapService.getCurrentBasemap().getView().getZoom();
    const maxZoom = this.basemapService.getCurrentBasemap().getView().getMaxZoom();
    this.getScaleLineWidth();
    if (currentZoom < maxZoom) {
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() + 1);
      this.getMapProjectionUnits();
    }
  }
  zoomOut(): any {
    const currentZoom = this.basemapService.getCurrentBasemap().getView().getZoom();
    const minZoom = this.basemapService.getCurrentBasemap().getView().getMinZoom();
    this.getScaleLineWidth();
    if (currentZoom > minZoom) {
      this.basemapService.getCurrentBasemap().getView().setZoom(this.basemapService.getCurrentBasemap().getView().getZoom() - 1);
      this.getMapProjectionUnits();
    }
  }

  getYoutubeEmbedUrl(url, autoplay = false): any {
    let retUrl = '';
    if (url.includes('embed')) {
      retUrl = url.trim();
    } else {
      retUrl = 'https://www.youtube.com/embed/' + this.getYoutubeVideoId(url);
      if (autoplay) {
        retUrl = retUrl + '?autoplay=1';
      }
    }
    return retUrl;
  }
  getYoutubeVideoId(url): any {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
      ? match[2]
      : null;
  }

  openPageFun(page): void{
    console.log('openPageFun');
    console.log(page);
    if (page === 'profile'){
      this.pageIcon = 'assets/images/profile.png';
      this.pageTitle = 'Profile';
    } else if (page === 'user-mgmt'){
      this.pageIcon = 'assets/images/profile.png';
      this.pageTitle = 'User Management';
    } else if (page === 'proj-mgmt'){
      this.pageIcon = 'assets/images/profile.png';
      this.pageTitle = 'Project Management';
    } else if (page === 'team-mgmt'){
      this.pageIcon = 'assets/images/profile.png';
      this.pageTitle = 'Team Management';
    }
    this.currentPage = page;
  }
  closePage(): void{
    this.currentPage = '';
    this.pageIcon = '';
    this.pageTitle = '';
  }

  openTourLink(from): void{
    let url = '';
    let withinSameTab = false;
    if (from === 'read'){
      url = 'https://mapsolgeo.com/fe/blog/';
      withinSameTab = true;
    } else if (from === 'watch'){
      url = 'https://mapsolgeo.com/fuseearth/watch.html';
      withinSameTab = true;
    } else if (from === 'learn'){
      url = 'https://mapsolgeo.com/fuseearth/learn.html';
      withinSameTab = true;
    } else if (from === 'tour'){
      url = 'https://mapsolgeo.com/fuseearth/tour.html';
      withinSameTab = true;
    } else if (from === 'fb'){
      url = 'https://facebook.com/fuse.earth';
    } else if (from === 'linkedin'){
      url = 'https://www.linkedin.com/showcase/fuse-earth/about/';
    } else if (from === 'twitter'){
      url = 'https://twitter.com/fuse_earth';
    } else if (from === 'slack'){
      url = 'https://mapsolworkspace.slack.com';
    }
    else if (from === 'instagram'){
      url = 'https://www.instagram.com/mapsol_geo_solutions/?igshid=YmMyMTA2M2Y%3D';
    }
    if (withinSameTab){
      window.open(url, '_self');
    }
    else{
      window.open(url, '_blank');
    }

  }

  defaultFEURL(): any {
    window.open('https://qa.fuse.earth/', '_self');
  }

  showAsModalFun(event): void{
    this.showAsModal = true;
    this.showFeSplashScreen = true;
    console.log('kkkkkkkkkkkk.....',event);
  }

  /* downloadPDF() {
    console.log('clicked on download PDF ');
    const dims = {
      a0: [1189, 841],
      a1: [841, 594],
      a2: [594, 420],
      a3: [420, 297],
      a4: [297, 210],
      a5: [210, 148],
    };
    const format = 'a4';
    const dim = dims[format];
    const resolution = 200; // 300dpi is very slow
    const width = Math.round((dim[0] * resolution) / 25.4);
    const height = Math.round((dim[1] * resolution) / 25.4);
    const map = this.basemapService.getCurrentBasemap();
    const size = map.getSize();
    const viewResolution = map.getView().getResolution();

    map.once('rendercomplete', function () {
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = width;
      mapCanvas.height = height;
      const mapContext = mapCanvas.getContext('2d');
      Array.prototype.forEach.call(
        document.querySelectorAll('.ol-layer canvas'),
        function (canvas) {
          if (canvas.width > 0) {
            const opacity = canvas.parentNode.style.opacity;
            mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
            const transform = canvas.style.transform;
            // Get the transform parameters from the style's transform matrix
            const matrix = transform
              .match(/^matrix\(([^\(]*)\)$/)[1]
              .split(',')
              .map(Number);
            // Apply the transform to the export map context
            CanvasRenderingContext2D.prototype.setTransform.apply(
              mapContext,
              matrix
            );
            mapContext.drawImage(canvas, 0, 0);
          }
        }
      );
      // const pdf = new jsPDF.jsPDF('landscape', undefined, format);
      const pdf = new jsPDF('landscape', undefined, format);
      pdf.addImage(
        mapCanvas.toDataURL('image/jpeg'),
        'JPEG',
        0,
        0,
        dim[0],
        dim[1]
      );
      pdf.save('FE-Map.pdf');
      // Reset original map size
      map.setSize(size);
      map.getView().setResolution(viewResolution);
    });
    // Set print size
    const printSize = [width, height];
    map.setSize(printSize);
    const scaling = Math.min(width / size[0], height / size[1]);
    map.getView().setResolution(viewResolution / scaling);
    console.log('download completed');
  } */
}

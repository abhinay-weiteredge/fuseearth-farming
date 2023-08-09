import { Component, OnInit, Input, SimpleChange, OnChanges, OnDestroy, EventEmitter, Output } from '@angular/core';
import { NgbModalConfig, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { SocialAuthService } from '../Services/socialAuthService';
import { AuthObservableService } from '../Services/authObservableService';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonService } from '../Services/common.service';
import { BasemapService } from '../basemap/basemap.service';
import { Observable, Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.scss'],
  providers: [NgbModalConfig, NgbModal]
})
export class UserLoginComponent implements OnInit, OnChanges, OnDestroy {

  closeResult: string;
  mouseDownTimeStamp: number;
  isGuest = true;
  defualtImageSrc = '/assets/images/profile.png';
  imageSrc = '/assets/images/profile.png';
  email = '';
  name = '';
  showProfileData = false;
  @Input() userProfile: any = {};
  @Input() pageClickEvent: any;
  @Input() pageType = '';
  @Output() openPage: EventEmitter<string> = new EventEmitter<string>();
  showLoginPrompt = false;
  mainPages = {
    LOGIN: 'login',
    CREATE_ORG: 'create_org'
  };
  mainPage = this.mainPages.LOGIN;
  orgName = '';
  userRole = '';
  authStatusMsgs = {status: '', code: '', ts: new Date().getTime()};
  showTooltip = false;

  lastUsageTimeStamp = new Date().getTime();
  intervalObservable: Observable<number>;
  interValSubs: Subscription;
  intervalDuaration = 5000;
  isHovered = false;

  constructor(config: NgbModalConfig, private modalService: NgbModal, private socialAuth: SocialAuthService,
              private commonService: CommonService,
              private authObsr: AuthObservableService, private http: HttpClient,
              private basemapService: BasemapService) {

    config.backdrop = 'static';
    config.keyboard = false;
    this.intervalObservable = interval(this.intervalDuaration);
    if (!this.commonService.isValid(this.interValSubs)) {
      console.log('DATA QUERY INTERVAL NOT EXIST. SO INITIATING.');
      this.startInterval();
    } else {
      console.log('DATA QUERY INTERVAL EXIST.');
    }
  }

  mouseEnter(): void{
    // console.log('IN mouseEnter');
    this.isHovered = true;
  }
  mouseLeave(): void{
    // console.log('IN mouseLeave');
    this.isHovered = false;
  }
  updateTimeStamp(): void{
    this.lastUsageTimeStamp = new Date().getTime();
    // console.log('LAST USED TIMESTAMP', this.lastUsageTimeStamp);
  }

  closeInterval(): void{
    // console.log('In close interval..');
    if (this.commonService.isValid(this.interValSubs)) {
      this.interValSubs.unsubscribe();
    }
  }

  startInterval(): void{
    // console.log('In start interval');
    if (this.commonService.isValid(this.interValSubs)) {
      this.interValSubs.unsubscribe();
    }
    this.interValSubs = this.intervalObservable.subscribe(res => {
        // console.log(this.intervalObservable);
        // console.log(res);
        // console.log('CALCULATE IDEL TIME..');
        const currTs = new Date().getTime();
        // console.log(currTs - this.lastUsageTimeStamp);
        if (currTs - this.lastUsageTimeStamp > 5000){
          // console.log('RIBBON OPENED JUST NOW');
          if (this.isHovered){
            // console.log('BUT CURSOR IS ON');
          } else{
            this.hideDropDown('');
            // console.log('EMIT TO CLOSE RIBBON');
          }
        } else {
          // console.log('RIBBON OPENED JUST NOW');
        }
    });
  }
  ngOnChanges(change: { [key: string]: SimpleChange }): void{
    console.log(change);
    if (this.commonService.isValid(change.pageClickEvent)) {
      if (!change.pageClickEvent.firstChange) {
        this.hideDropDown('');
      }
    }
    if (this.commonService.isValid(change.userProfile)) {
      if (!change.userProfile.firstChange) {
        this.orgName = this.userProfile.orgInfo.name;
        this.userRole = /*'USER_ADMIN'; /*/ this.userProfile.userOrgRolesInfo.roleName;
      }
    }
  }
  mouseDown(): void{
    this.mouseDownTimeStamp = new Date().getTime();
  }
  // open(event, content) {
  //   console.log('open');
  //   console.log(event);
  //   if (new Date().getTime() - this.mouseDownTimeStamp < 500) {
  //     // console.log('Click');
  //     // console.log(new Date());
  //     this.googleSignIn();
  //     // this.modalService.open(content, {ariaLabelledBy: 'modal-basic-title'}).result.then((result) => {
  //     //   this.closeResult = `Closed with: ${result}`;
  //     // }, (reason) => {
  //     //   this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
  //     // });
  //   } else {
  //     console.log('DRAG EVENT');
  //   }
  // }
  showHideProfileData(): void{
    this.getUserData();
    if (new Date().getTime() - this.mouseDownTimeStamp < 500) {
      // console.log('Click');
      // console.log(new Date());
      this.showProfileData = !this.showProfileData;
    } else {
      console.log('DRAG EVENT');
    }
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  getUserData(): void{
    this.email = localStorage.getItem('email');
    this.name = localStorage.getItem('name');
    const photo = localStorage.getItem('photo');
    if (this.isValid(photo)) {
      this.imageSrc = photo;
    }
  }
  ngOnInit(): void{
    this.authObsr.subscribeForAuthStatus('UserLoginComponent', (authRes, msg) => {
      console.log('ALERT CHANGED');
      console.log(authRes);
      console.log(msg);
      if (authRes.status === 'success') {
        this.isGuest = false;
        this.showTooltip = false;
        this.getUserData();
        this.modalService.dismissAll();
        this.authStatusMsgs = { status: 'SUCCESS', code: 'SUCCESS', ts: new Date().getTime()};
      } else if (authRes.status === 'failed') {
        this.isGuest = true;
        this.showTooltip = true;
        this.imageSrc = this.defualtImageSrc;
        let errMsg = '';
        if (authRes.code === 'WAITING_FOR_APPROVAL'){
          errMsg = 'Your registration request has not been approved yet. Please contact the organization administrator.';
        } else if (authRes.code === 'REJECT'){
          errMsg = 'Your registration request has been rejected. Please contact the organization administrator.';
        } else if (authRes.code === 'ONHOLD'){
          errMsg = 'Your account is put on-hold. Please contact the organization administrator.';
        } else if (authRes.code === 'INACTIVE'){
          errMsg = 'Your account is in-active. Please contact the organization administrator.';
        } else if (authRes.code === 'SERVER_DOWN'){
          errMsg = 'Server down, Please try again after some time.';
        } else{
          errMsg = '';
        }
        this.authStatusMsgs = { status: errMsg, code: authRes.code, ts: new Date().getTime()};
      }
    });
    if (this.socialAuth.isAuthenticated()) {
      console.log('Authenticated');
      this.isGuest = false;
      this.showTooltip = false;
      this.getUserData();
    } else {
      console.log('Not authenticated');
      this.isGuest = true;
      this.showTooltip = true;
    }
    console.log(this);

    this.authObsr.subscribeForAuthenticationRequest('UserLoginComponent', (status, msg) => {
      console.log('Received authentication request');
      console.log(status);
      console.log(msg);
      // let confirmMsg = '';
      // if (status.from === 'geobar-geobase') {
      //   confirmMsg = 'Please login to access Geobase.';
      // } else if (status.from === 'geobar') {
      //   confirmMsg = 'Please login to search for location.';
      // } else if (status.from === 'geotower') {
      //   confirmMsg = 'Please login to save layer.';
      // } else if (status.from === 'geotray-save-share') {
      //   confirmMsg = 'Please login to share/save session. ';
      // } else if (status.from === 'geotray') {
      //   confirmMsg = 'Please login to use tools. ';
      // } else {
      //   confirmMsg = 'Please login to continue.';
      // }
      // confirmMsg = confirmMsg + '\nPress `OK` to continue. \nPress `CANCEL` to close.';
      // const confirm = window.confirm(confirmMsg);
      // console.log(confirm);
      // if (confirm) {
      //   this.mouseDown();
      //   this.open('', '');
      // }
      this.showLoginPrompt = true;
    });
  }

  cancelLogin(): void{
    this.showLoginPrompt = false;
    this.mainPage = this.mainPages.LOGIN;
    this.authStatusMsgs = { status: '', code: '', ts: new Date().getTime()};
  }
  ngOnDestroy(): void{
    this.authObsr.unSubscribeForAuthStatus('UserLoginComponent');
    this.authObsr.unSubscribeForAuthenticationRequest('UserLoginComponent');
    try{
      this.closeInterval();
      this.intervalObservable = null;
    } catch (e) {
      console.log(e);
    }
  }
  isValid(str): boolean{
    return this.commonService.isValid(str);
  }
  signOut(): void{
    this.socialAuth.logoutFromFirebase();
    localStorage.clear();
    this.showProfileData = false;
    this.imageSrc = this.defualtImageSrc;
    // i have added new code for logout
    const results = this.basemapService.userLocation();
    console.log('what is the Error Here? ', results);
    if (results === undefined) {
      const longitude = -119.417931; // 78.433237;
      const latitude = 36.778259; // 17.661594;
      this.basemapService.getCurrentBasemap().getView().setCenter([longitude, latitude]);
    }
    this.basemapService.getCurrentBasemap().getView().setZoom(4);
    this.basemapService.getCurrentBasemap().getView().setRotation(0);
  }
  hideDropDown(e): void{
    // console.log('IN hideDropDown');
    this.showProfileData = false;
  }

  createOrganization(event): void{
    console.log('In createOrganization');
    console.log(event);
    this.mainPage = this.mainPages.CREATE_ORG;
  }
  showPageFun(event): void{
    console.log('IN showPageFun');
    console.log(event);
    // this.cancelLogin();
    this.authObsr.updateTermsPage(event);
  }
  openPageFun(page: string): void{
    // console.log('IN openPageFun');
    // console.log(page);
    this.hideDropDown('');
    this.openPage.emit(page);
  }
  closeTooltip(): void{
    console.log('closeTooltip');
    this.showTooltip = false;
  }
}

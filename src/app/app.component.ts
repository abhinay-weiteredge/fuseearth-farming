import { Component, EventEmitter } from '@angular/core';
import * as firebase from 'firebase';
import { environment } from 'src/environments/environment';
// import { NgbModalConfig, NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
// import { ISlimScrollOptions, SlimScrollEvent } from 'ngx-slimscroll';
import { AuthObservableService } from './Services/authObservableService';
// import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from './Services/common.service';
import { CustomSpinner } from './Services/SpinnerService';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Geomocus';
  pageClickEvent: any;
  latestToken = false;
  closeResult: string;
  // tcAndPrivacyActivePage: String = 'tc';
  // opts: ISlimScrollOptions;
  // scrollEvents: EventEmitter<SlimScrollEvent>;
  // pageTypes = {
  //   SHARE: 'share',
  //   SESSION: 'session',
  //   COVID19: 'COVID19',
  //   DEFAULT: 'default'
  // };
  // params: any = {};
  // pageType = '';

  constructor(
    // config: NgbModalConfig, private modalService: NgbModal,
              private authObsr: AuthObservableService, private commonService: CommonService,
              private spinner: CustomSpinner
              // private actRoute: ActivatedRoute, private router: Router
              ) {
    this.setEnvironmentBasedConfig();
    // config.backdrop = 'static';
    // config.keyboard = false;
    // this.params = this.actRoute.snapshot.params;
    // setTimeout(() => {
    //   this.geobaseProcess();
    // }, 3000);
    // this.scrollEvents = new EventEmitter<SlimScrollEvent>();
    // this.opts = {
    //   position: 'right',
    //   barBackground: '#656565', // '#C9C9C9',
    //   barOpacity: '0.7',
    //   barWidth: '7', // '10',
    //   barBorderRadius: '5', // '20',
    //   barMargin: '0',
    //   gridBackground: '#D9D9D9',
    //   gridOpacity: '1',
    //   gridWidth: '2',
    //   gridBorderRadius: '20',
    //   gridMargin: '0',
    //   alwaysVisible: true,
    //   visibleTimeout: 1000,
    //   // scrollSensitivity: 1
    // };

    firebase.default.initializeApp(environment.firebase);
    this.refreshAuth();
    this.authObsr.subscribeForAuthStatus('AppComponent', (authRes, msg) => {
      console.log('LOGIN STATUS CHANGED');
      console.log(authRes);
      console.log(msg);
      if (authRes.status === 'success') {
      } else if (authRes.status === 'failed') {
        this.latestToken = true;
        this.spinner.hide();
      }
    });
  }

  setEnvironmentBasedConfig(): void{
    const disableConsoleLogs = environment.disableConsoleLogs;
    if (disableConsoleLogs) {
      // DISABLING LOGS
      console.log = () => {};
    }
   }

  // geobaseProcess(): any {
  //   if (this.commonService.isValid(this.params.sessionId) && this.commonService.isValid(this.params.uuid)) {
  //     this.pageType = this.pageTypes.SHARE; // 'share';
  //   } else if (this.commonService.isValid(this.params.sessionId)) {
  //     this.pageType = this.pageTypes.SESSION; // 'session';
  //   } else if (String(this.router.url).includes('covid')){
  //     this.pageType = this.pageTypes.COVID19; // 'covid19';
  //   } else {
  //     this.pageType = this.pageTypes.DEFAULT; // 'default';
  //   }
  // }


  refreshAuth(): void{
    /**
     * DO PERIODIC TOKEN REFRESH ONLY WHEN FIREBASE AUTHENTICATION ACTIVE
     */
    firebase.default.auth().onAuthStateChanged((user) => {
      console.log('FIREBASE onAuthStateChanged');
      if (user) {
        console.log('USER EXIST');
        console.log(user);
        this.periodicCheckTokenRefresh();
        // setTimeout(() => {
        this.checkTokenValidityToRefresh();
        // }, 100);
      } else {
        console.log('USER NOT EXIST');
        console.log(user);
        console.log('WE HAVE LATEST TOKEN LOADING PAGES...');
        this.latestToken = true;
        this.spinner.hide();
      }
    }).bind(this);
  }

  /**
   * FUNCTION TO REFRESH TOKEN OF FIREBASE PERIODICALLY
   */
  periodicCheckTokenRefresh(): void{
    setTimeout(() => {
      this.checkTokenValidityToRefresh();
      this.periodicCheckTokenRefresh();
    }, 300000); /// 5 MINS
  }

  checkTokenValidityToRefresh(): void{
    // console.log('Token refresh at : ',new Date().toLocaleTimeString());
    const id = String(localStorage.getItem('email'));
    if (this.commonService.isValid(id)) {
      console.log('VALID EMAIL FOUND');
      try {
        if ((new Date().getTime() - Number(localStorage.getItem('fTokenStartTime'))) >= 900000) {
          // 900000 --> 15 MINS
          // console.log('MORE THAN 15 mins');
          if ((new Date().getTime() - Number(localStorage.getItem('fTokenStartTime'))) >= 3500000) {
            console.log('WE DONT HAVE LATEST TOKEN AND GETTING NEW...TIME : ',
              (new Date().getTime() - Number(localStorage.getItem('fTokenStartTime'))));
          } else {
            /// TOKEN TIME IS LESS THAN AN HOUR. SO, LOADING PAGES...
            this.latestToken = true;
            this.spinner.hide();
          }
          this.refreshToken(true);
        } else {
          this.refreshToken();
          console.log('WE HAVE LATEST TOKEN LOADING PAGES...');
          this.latestToken = true;
          this.spinner.hide();
        }
      } catch (e) { this.refreshToken(true); }
    } else {
      console.log('NOT A VALID EMAIL');
      this.latestToken = true; // false;
      this.spinner.hide();
    }
  }

  /**
   * FUNCTION TO REFRESH FIREBASE TOKEN
   */
  refreshToken(forceRefresh = false): void{
    //  console.log(' IN REFRESH TOKEN');
    //  console.log(this.afAuth.auth);
    //  console.log(this.afAuth.auth.currentUser);

    if (forceRefresh) {
      console.log('FORCEFULLY REFRESHING FIREBASE TOKEN');
    }
    try {
      if (this.commonService.isValid(firebase.default.auth().currentUser)) {
        firebase.default.auth().currentUser.getIdToken(forceRefresh)
          // firebase.auth().currentUser.getIdToken(/ forceRefresh / true)
          .then((idToken) => {
            // console.log('TOKEN REFRESHED');
            // console.log(idToken);
            localStorage.setItem('token', idToken);
            console.log('GOT LATEST REFRESHED TOKEN...');
            this.latestToken = true;
            if (forceRefresh) {
              localStorage.setItem('fTokenStartTime', String(new Date().getTime()));
            }
          }).catch((error) => {
            // console.log('REFRESH TOKEN ERROR');
            console.log(error);
          });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // openAppInfo(event, content) {
  //   this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
  //     this.closeResult = `Closed with: ${result}`;
  //   }, (reason) => {
  //     this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
  //   });
  // }
  // private getDismissReason(reason: any): string {
  //   if (reason === ModalDismissReasons.ESC) {
  //     return 'by pressing ESC';
  //   } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
  //     return 'by clicking on a backdrop';
  //   } else {
  //     return `with: ${reason}`;
  //   }
  // }
}

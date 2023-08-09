import { Injectable, NgZone } from '@angular/core';

import { Router } from '@angular/router';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { AuthObservableService } from './authObservableService';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase';
import { CustomSpinner } from './SpinnerService';
import { HttpClientService } from './http-client.service';
import { environment } from 'src/environments/environment';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { CommonService } from './common.service';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root'
})
export class SocialAuthService {

  redirectURL = '';
  profileJSON: any;
  isOrgPage: boolean;
  serverUrl = environment.serverUrl;
  constructor(private router: Router, private zone: NgZone, private authObsr: AuthObservableService,
              private http: HttpClientService, private commonService: CommonService,
              public afAuth: AngularFireAuth, private spinner: CustomSpinner,
              private analytics: AnalyticsService) {
    console.log('SOCIAL AUTH CONS');

  }

  isAuthenticated(): boolean {
    if (this.getAuthenticationToken()) {
      return true;
    }
    return false;
  }
  getAuthenticationToken(): string {
    let token: string;
    token = localStorage.getItem('email');
    return token;
  }

  sendAuthStatusToSubscribers(status): void{
    console.log('SENDIN AUTH STATUS');
    this.authObsr.updateAuthStatus(status);
  }

  doFirebaseGoogleLogin(operation): Promise<any>{
    console.log('IN GOOGLE LOGIN...');
    return new Promise<any>((resolve, reject) => {

      firebase.default.auth().setPersistence(firebase.default.auth.Auth.Persistence.LOCAL)
        .then( () => {
          console.log('PERSISTANCE SET TOT LOCAL');
          const provider = new firebase.default.auth.GoogleAuthProvider();
          provider.addScope('profile');
          provider.addScope('email');
          provider.setCustomParameters({
            prompt: 'select_account'
          });
          firebase.default.auth()
            .signInWithPopup(provider)
            .then(res => {
              console.log('GOOGLE RESPONSE');
              console.log(res);
              console.log(res.credential);
              this.storeFirebaseTokenAndGetProfile(res, 'google');
              resolve(res);
            }, err => {
              console.log('ERROR');
              console.log(err);
              reject(err);
              this.sendAuthStatusToSubscribers({status: 'failed', code: ''});
            })
            .catch(err => {
              console.log('ERROR');
              console.log(err);
              reject(err);
              this.sendAuthStatusToSubscribers({status: 'failed', code: ''});
            });
        })
        .catch( (error) => {
          // Handle Errors here.
          console.error('SET PERSITANCE ERROR');
          console.error(error);
        });

    });
  }

  /**
   * FUNCTION TO CREATE USER WITH EMAIL, PASSWORD IN FIREBASE
   */
  createUserWithEmailAndPassword(email, password, name): Promise<firebase.default.auth.UserCredential>{
    return firebase.default.auth().createUserWithEmailAndPassword(email, password)
        .then(res => {
          console.log('USER CREATE SUCCESS');
          console.log(res);
          res.user.updateProfile({ displayName: name, photoURL: null })
              .then(profileRes => {
                console.log('PROFILE SET RERSPOSEEN');
                console.log(profileRes);
              }).catch(err => {
                console.log('PROFILE SET ERR');
                console.log(err);
              });
            /// SENDING EMAIL VERIFICATION TO GIVEN MAIL-ID FOR FIRST TIME
          res.user.sendEmailVerification().then(verResponse => {
              console.log('VERIFICATION RERSPOSEEN');
              console.log(verResponse);
            }).catch(err => {
              console.log('VER ERR');
              console.log(err);
            });
          return res;
        }, error => {
          throw(error);
        }).catch(err => {
          throw(err);
        });
  }

 /**
  * FUNCTION TO SEND EMAIL VERIFICATION LINK TO CURRENT USER IN FIREBASE
  */
  sendEmailVerificationToCurrentUser(): Promise<void>{
    if (firebase.default.auth().currentUser){
      return firebase.default.auth().currentUser.sendEmailVerification();
    }
  }

  getProviderOfAnEmail(email): Promise<string[]>{
    return firebase.default.auth().fetchSignInMethodsForEmail(email);
  }


  /**
   * Function to update display name
   */
  updateDisplayName(name: string): Promise<void>{
    return firebase.default.auth().currentUser.updateProfile({displayName: name});
  }

  /**
   * Function to update password
   */
  updatePassword(pwd: string): Promise<any>{
    return firebase.default.auth().currentUser.updatePassword(pwd);
  }

 /**
  * FUNCTION TO SEND PASSWORD RESET LINK TO EMAIL IN FIREBASE FOR USER/PWD PROVIDER
  */
 sendPasswordResetEmail(email): Promise<void>{
      return firebase.default.auth().sendPasswordResetEmail(email)
            .then(result => {
              return result;
            }, err => {
              throw(err);
            })
            .catch(error => {
              throw(error);
            });
 }

 /**
  * FUNCTION TO SIGN-IN WITH EMAIL, PASSWORD FOR FIREBASE ACCOUNT
  */
 signInWithEmailAndPassword(email, password,
                            linkFbWithEmail= false, fbLinkCredentials: any= {},
                            isOrgPage= false): Promise<firebase.default.auth.UserCredential>{
  this.isOrgPage = isOrgPage;
  return firebase.default.auth().signInWithEmailAndPassword(email, password)
          .then(res => {
              console.log('SIGNIN WITH EMAIL PWD RES');
              console.log(res);
              // if (res.user.emailVerified){
              this.storeFirebaseTokenAndGetProfile(res, 'password');

                // /// LINKING FB CREDENTIALS TO EMIAL/PWD FIREBASE ACCOUNT
                // if (linkFbWithEmail){
                //   firebase.default.auth().currentUser.linkWithCredential(fbLinkCredentials.credential).then(result => {
                //     console.log('LINK SUCCESS');
                //     console.log(result);
                //   }).catch(error => {
                //     console.log('LINK FAILED ');
                //     console.log(error);
                //   });
                // }
              // }
              return res;
            }, error => {
              throw(error);
            }).catch(err => {
              throw(err);
            });
 }

  /**
   * FUNCTION TO STORE FIREBASE TOKEN AND GET PROFILE DATA
   */
   storeFirebaseTokenAndGetProfile(res, provider): void{
    console.log('IN storeFirebaseTokenAndGetProfile');
    console.log(res);
    const user = {
      token: res.user._lat,
      id: res.user.uid,
      email: res.user.email,
      name: res.user.displayName,
      photoUrl: res.user.photoURL
    };
    console.log(user);
    localStorage.setItem('token', user.token);
    localStorage.setItem('fTokenStartTime', String(new Date().getTime()));
    this.getProfileOfLoggedInUser(user, provider);
  }

  getProfileOfLoggedInUser(user, provider): void{
    if (this.commonService.isValid(localStorage.getItem('token'))) {

      // GET PROFILE FROM SERVER
      this.getProfileData().subscribe(result => {
        console.log('GOT PROFILE DATA');
        console.log(result);
        let allowLogin = false;
        if (String(result.userOrgRolesInfo.roleName).toLowerCase() === 'solve'){
          console.log('INDIVIDUAL USER LOGIN');
          allowLogin = true;
        } else if (result.userOrgRolesInfo.roleName === 'USER_ADMIN'){
          console.log('ADMIN LOGIN');
          allowLogin = true;
        } else if (result.user.status === 'ACTIVE'){
          console.log('OTHER LOGIN AND ACTIVE USER');
          allowLogin = true;
        }  else {
          console.log('OTHER LOGIN AND NOT ACTIVE');
          allowLogin = false;
          this.sendAuthStatusToSubscribers({status: 'failed', code: result.user.status});
        }

        if (allowLogin && !firebase.default.auth().currentUser.emailVerified){
          this.sendAuthStatusToSubscribers({status: 'failed', code: 'EMAIL_NOT_VERIFIED'});
        } else if (allowLogin && firebase.default.auth().currentUser.emailVerified){
          localStorage.setItem('provider', provider);
          localStorage.setItem('email', user.email);
          localStorage.setItem('name', user.name);
          localStorage.setItem('photo', user.photoUrl);
          this.sendAuthStatusToSubscribers({status: 'success', code: ''});

          /**
           * SENDING LOGIN EVENT TO GOOGLE ANALYTICS
           */
          this.analytics.sendLoginData(user.name, user.email, 'Login', provider);
          // console.log('SENT LOGIN GOOGLE ANALYTICS');

        }
        this.spinner.hide();
      }, error => {
        console.log('ERROR WHILE GETTING PROFILE');
        console.log(error);
        let code = '';
        if (error.status === 0){
          code = 'SERVER_DOWN';
        }
        this.sendAuthStatusToSubscribers({status: 'failed', code});
        this.spinner.hide();
      });


    }
  }


  getProfileData(): Observable<any>{
    const url = this.serverUrl + '/api/profile';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        // window.open('https://qa.fuse.earth/maintenance', '_self');
        return throwError(err);
      }));
  }

//   ../api/organizations - GET(get org details by token)
// ../api/guest/organizations/create - POST(request json organizationInfo)
// ../api/guest/organizations/search/{orgname} - GET
// ../api/guest/organizations/list - GET
  getOrganizations(): Observable<any>{
    const url = this.serverUrl + '/api/organization';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      }));
  }
  getGuestOrganizationsList(): Observable<any>{
    const url = this.serverUrl + '/api/guest/organization/list';
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      }));
  }
  getOrganizationsWithSearchStr(searchStr): Observable<any>{
    const url = this.serverUrl + '/api/guest/organization/search/' + searchStr;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      }));
  }
  // .../fusedotearth/api/guest/organization/{orgName}
  getOrganizationsWithName(name): Observable<any>{
    const url = this.serverUrl + '/api/guest/organization/' + name;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      }));
  }

  // ../api/guest/organization/create/organizationAndAdmin
  createOrganizationAndAdmin(data): Observable<any>{
    const url = this.serverUrl + '/api/guest/organization/create/organizationAndAdmin';
    return this.http.post(url, data);
  }

  createUserUnderAnOrg(data): Observable<any>{
    // /api/guest/userSignUp
    const url = this.serverUrl + '/api/guest/userSignUp';
    return this.http.post(url, data);
  }

  getUserOfAnOrganization(orgId): Observable<any>{
    // https://qa.fuse.earth:8443/fusedotearth/api/organization/{orgId}/users/list
    const url = `${this.serverUrl}/api/organization/${orgId}/users/list`;
    return this.http.get(url)
      .pipe(map((response: any) => {
        return response;
      }), catchError((err: any) => {
        console.log(err);
        return throwError(err);
      }));
  }
  updateUserOfAnOrg(email: string, status: string): Observable<any>{
    const url = `${this.serverUrl}/api/organization/user/profile/status/update?emailId=${email}&userStatus=${status}`;
    return this.http.post(url, {});
  }


  /**
   * FUNCTION TO LOGOUT FROM FIREBASE
   */
  logoutFromFirebase(): void{
    firebase.default.auth().signOut();
    this.sendAuthStatusToSubscribers({status: 'failed', code: ''});
  }
}

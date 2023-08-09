import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonService, ElementType } from 'src/app/Services/common.service';
import { SocialAuthService } from 'src/app/Services/socialAuthService';
import { CustomSpinner } from 'src/app/Services/SpinnerService';

@Component({
  selector: 'app-user-sign-up',
  templateUrl: './user-sign-up.component.html',
  styleUrls: ['./user-sign-up.component.scss']
})
export class UserSignUpComponent implements OnInit, OnChanges {

  @Input() authStatusMsgs: any = {};
  @Output() showPage: EventEmitter<string> = new EventEmitter<string>();
  @Output() closeLogin: EventEmitter<any> = new EventEmitter<any>();
  @Output() createOrg: EventEmitter<any> = new EventEmitter<any>();
  mainPages = {
    SIGN_IN_UP: 'sign_in_and_sign_up',
    THNX_SIGN_IN_UP: 'thax_sign_in_and_sign_up',
    FORGOT_PWD: 'forgot_pwd'
  };
  mainPage = this.mainPages.SIGN_IN_UP;
  selectedSubPage = 'Login';

  signUpUserType: FormControl = new FormControl('individualUser');
  loginForm: FormGroup;
  indvSignUpForm: FormGroup;
  orgSignUpForm: FormGroup;
  errMsg = '';
  sentActivationLink = '';
  emailVerified = '';
  forgotPwdForm: FormGroup;
  showsignuppage=true;
  showpackagepage=false;
  @ViewChild('signInEmail') signInEmail: ElementRef<HTMLInputElement>;
  @ViewChild('forgotPwdEmail') forgotPwdEmail: ElementRef<HTMLInputElement>;
  passwordLinkSent: string;

  orgSearchObserver: Subject<any> = new Subject<any>();
  fetchStatus = {
    COMPLETED: 'COMPLETED',
    INPROGRESS: 'INPROGRESS',
    UNKNOWN: ''
  };
  orgFetchStatus = this.fetchStatus.UNKNOWN;
  displayTeamsList = false;
  orgsList: any[] = [];
  showTeamList: boolean;
  months: string[];
  exploreplan: { index: number; month: string; amount: string; }[];
  engageplan: { index: number; month: string; amount: string; }[];
  showstartertick: boolean;
  showexploretick: boolean;
  showengagetick: boolean;
  selectedexploremonth: any;
  selectedexpplanprice: any;
  selectedengagemonth: any;
  selectedengageprice: any;
  
  constructor(private commonService: CommonService, private firebaseAuth: SocialAuthService,
              private spinner: CustomSpinner) {
                this.months=['1 month','3 months','6 months','9 months','12 months']
  this.exploreplan=[
    {index: 1, month: '1 month' , amount: '$ 200' },
    {index: 2, month: '3 months' , amount: '$ 600' },
    {index: 3, month: '6 months' , amount: '$ 1200' },
    {index: 4, month: '9 months' , amount: '$ 1800' },
    {index: 5, month: '12 months' , amount: '$ 2400' }
  ]; 
  this.engageplan=[
    {index: 1, month: '1 month' , amount: '$ 500' },
    {index: 2, month: '3 months' , amount: '$ 1500' },
    {index: 3, month: '6 months' , amount: '$ 3000' },
    {index: 4, month: '9 months' , amount: '$ 4500' },
    {index: 5, month: '12 months' , amount: '$ 6000' }
  ];
    this.signUpUserType.valueChanges.subscribe(val => {
      this.resetData();
    });
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required])
    });
    this.indvSignUpForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(1)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(1)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)])
    });
    this.orgSignUpForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(1)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(1)]),
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      organizationName: new FormControl('', [Validators.required])
    });
    this.forgotPwdForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email])
    });

    this.loginForm.valueChanges.subscribe(res => {
      // console.log(this.loginForm.valid);
      if (!this.loginForm.valid){
        this.errMsg = '';
      }
    });
    this.loginForm.get('email').valueChanges.subscribe(res => {
      // console.log(this.loginForm.valid);
      if (!this.commonService.isValid(res)){
        this.loginForm.get('password').reset();
      }
    });
    this.indvSignUpForm.valueChanges.subscribe(res => {
      // console.log(this.indvSignUpForm.valid);
      if (!this.indvSignUpForm.valid){
        this.errMsg = '';
      }
    });
    this.orgSignUpForm.valueChanges.subscribe(res => {
      // console.log(this.orgSignUpForm.valid);
      if (!this.orgSignUpForm.valid){
        this.errMsg = '';
      }
    });
    this.forgotPwdForm.valueChanges.subscribe(res => {
      // console.log(this.forgotPwdForm.valid);
      if (!this.forgotPwdForm.valid){
        this.errMsg = '';
      }
    });
    this.monitorChangesOrganizationName();
    // this.orgSignUpForm.get('organizationName').valueChanges
    //       .subscribe(searchKey => {
    //         console.log('Org name changed...');
    //         console.log(searchKey);
    //         this.orgFetchStatus = this.fetchStatus.UNKNOWN;
    //         if (this.commonService.isValid(searchKey)) {
    //           console.log('VALID');
    //           if (searchKey.length > 1){
    //             console.log(searchKey.length);
    //             console.log(this.orgSearchObserver);
    //             this.orgSearchObserver.next({str: searchKey, ts: String(new Date().getTime())});
    //           } else if (searchKey.length <= 1){
    //             console.log('LESS : ', searchKey.length);
    //             this.orgSearchObserver.next({str: '', ts: String(new Date().getTime())});
    //           }
    //         } else{
    //           console.log('NOT VALID');
    //           this.orgSearchObserver.next({str: '', ts: String(new Date().getTime())});
    //         }
    //       });
  }

  ngOnInit(): void {
    this.selectedexpplanprice=this.exploreplan[0]["amount"];
    this.selectedengageprice=this.engageplan[0]["amount"];
  }

  ngOnChanges(change: { [key: string]: SimpleChange }): void{
    console.log(change);
    if (this.commonService.isValid(change.authStatusMsgs)) {
      if (this.authStatusMsgs.status === 'SUCCESS'){
        this.closeLogin.emit('close');
      } else if (this.authStatusMsgs.code === 'EMAIL_NOT_VERIFIED'){
        this.emailVerified = 'false';
      } else {
        this.errMsg = this.authStatusMsgs.status;
      }
    }
  }

  resetData(): void{
    this.errMsg = '';
    this.loginForm.reset();
    this.indvSignUpForm.reset();
    this.orgSignUpForm.reset();
    this.sentActivationLink = '';
    this.emailVerified = '';
  }

  setSubPage(sPage: string): void{
    this.selectedSubPage = sPage;
    this.resetData();
  }
  showLoginPage(): void{
    this.mainPage = this.mainPages.SIGN_IN_UP;
    this.setSubPage('Login');
  }

  setForgotPwdPage(): void{
    this.forgotPwdForm.reset();
    this.forgotPwdForm.setErrors(null);
    this.errMsg = '';
    this.passwordLinkSent = '';
    this.mainPage = this.mainPages.FORGOT_PWD;
    setTimeout(() => {
        this.forgotPwdEmail.nativeElement.focus();
    }, 1000);
  }

  sendPwdResetEmail(): void{
    this.errMsg = '';
    this.passwordLinkSent = '';
    const data = this.forgotPwdForm.value;
    console.log(this);
    let errorFound = false;
    if (!this.forgotPwdForm.valid){
      console.log('NOT VALID');
      this.loginForm.get('email').markAsTouched();
      errorFound = true;
    }

    if (!errorFound){
      console.log(data);
      this.spinner.show();
      this.firebaseAuth.sendPasswordResetEmail(data.email)
            .then(result => {
              this.spinner.hide();
              console.log('PASSWORD RESET EMAIL SENT');
              console.log(result);
              this.showLoginPage();
              this.passwordLinkSent = 'Password reset link has been sent to <b>' + data.email + '</b>.';
              setTimeout(() => {
                this.passwordLinkSent = '';
              }, 5000);
            })
            .catch(error => {
              this.spinner.hide();
              console.log('ERROR WHILE SENDING PASSWORD RESET EMAIL');
              console.log(error);
              let title = '';
              let msg = '';
              if (error.code === 'auth/user-not-found'){
                  title = 'User not found';
                  msg = 'User with email ' + data.email + ' not exist';
              } else{
                  title = 'Error...';
                  msg = 'Error while sending password reset link.';
              }
              this.errMsg = msg;
            });
    }
  }

  getErrorMsg(ctrl: FormControl, name: string, type = ElementType.INPUT): string{
    return this.commonService.getFormErrorMsg(ctrl, name, type);
  }

  validateLogin(): void{
    console.log('In validateLogin');
    let errorFound = false;
    this.errMsg = '';
    console.log(this.loginForm.value);
    console.log(this.loginForm);
    try{
      if (!this.loginForm.valid){
        console.log('NOT VALID');
        this.loginForm.get('email').markAsTouched();
        this.loginForm.get('password').markAsTouched();
        errorFound = true;
      }
    } catch (e){
      errorFound = true;
      this.errMsg = e;
      console.log(e);
    }

    if (!errorFound){
      console.log('All GOOD');
      console.log(this.loginForm.value);
      const data = this.loginForm.value;
      const credentials = {
        email: data.email,
        password: data.password
      };
      this.spinner.show();
      this.firebaseAuth.signInWithEmailAndPassword(credentials.email, credentials.password)
        // this.linkFbWithEmail, this.linkCredentials, this.isOrgPage)
            .then(res => {
                console.log('SIGNIN WITH EMAIL PWD RES');
                console.log(res);
                // this.emailVerified = String(res.user.emailVerified);
                if (!res.user.emailVerified){
                    // this.spinner.hide();
                }
                else{
                  this.resetData();
                  // this.closeLogin.emit('close');
                }
              }, error => {
                console.error('SIGN IN WITH EMAIL PWD ERR');
                console.error(error);
                if (error.code === 'auth/wrong-password'){
                  this.firebaseAuth.getProviderOfAnEmail(credentials.email)
                      .then(providersRes => {
                        console.log('PROVIDERS RES');
                        console.log(providersRes);
                        const index = providersRes.findIndex(val => val === 'password');
                        if (index !== -1){
                          /// E-MAIL ID REGISTERED WITH PROVIDER 'PASSWORD'
                          this.errMsg = 'Incorrect password...';
                        } else{
                          /// E-MAIL ID NOT REGISTERED YET WITH PROVIDER 'PASSWORD'
                          this.errMsg = 'This email already registered with provider GOOGLE/ FACEBOOK';
                        }
                        this.spinner.hide();
                      }, err => {
                        this.errMsg = 'Incorrect password...';
                        this.spinner.hide();
                      }).catch(err => {
                        this.errMsg = 'Incorrect password...';
                        this.spinner.hide();
                      });
                } else if (error.code === 'auth/user-not-found'){
                  this.errMsg = 'User not found, please Sign-Up';
                  this.spinner.hide();
                }
                this.emailVerified = '';
                this.sentActivationLink = '';
            })
            .catch(err => {
                this.spinner.hide();
                console.error('SIGN IN WITH EMAIL PWD ERR');
                console.error(err);
                if (err.code === 'auth/wrong-password') {
                  this.errMsg = 'Incorrect password...';
                } else if (err.code === 'auth/user-not-found') {
                  this.errMsg = 'User not found, please Sign-Up';
                }
                this.emailVerified = '';
                this.sentActivationLink = '';
            });
    }
  }

  validateIndvSignupForm(): void{
    console.log('In validateIndvSignupForm');
    let errorFound = false;
    this.errMsg = '';
    this.authStatusMsgs = {};
    console.log(this.indvSignUpForm.value);
    try{
      if (!this.indvSignUpForm.valid){
        console.log('NOT VALID');
        this.indvSignUpForm.get('firstName').markAsTouched();
        this.indvSignUpForm.get('lastName').markAsTouched();
        this.indvSignUpForm.get('email').markAsTouched();
        this.indvSignUpForm.get('password').markAsTouched();
        errorFound = true;
      }
    } catch (e){
      errorFound = true;
      this.errMsg = e;
    }

    if (!errorFound){
      console.log('All GOOD');
      console.log(this.indvSignUpForm.value);
      const data = this.indvSignUpForm.value;
      const credentials = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: data.password
      };
      this.spinner.show();
      this.firebaseAuth.createUserWithEmailAndPassword(credentials.email, credentials.password, credentials.name)
        .then(res => {
            console.log('USER CREATE SUCCESS');
            console.log(res);
            this.mainPage = this.mainPages.THNX_SIGN_IN_UP;
            this.spinner.hide();
        }, error => {
            console.log(error);
            console.log('USER CREATE FAILED');
            if (error.code === 'auth/email-already-in-use'){
              console.log('The email address is already in use by another account.');
              this.errMsg = 'The email address is already in use by another account.';
            } else {
              this.errMsg = 'Unknown Error';
            }
            this.spinner.hide();
        }).catch(err => {
            console.log('USER CREATE FAILED');
            if (err.code === 'auth/email-already-in-use'){
              console.log('The email address is already in use by another account.');
              this.errMsg = 'The email address is already in use by another account.';
            } else {
              this.errMsg = 'Unknown Error';
            }
            this.spinner.hide();
            console.log(err);
        });
    }
  }

  validateOrgSignupForm(): void{
    console.log('In validateOrgSignupForm');
    // window.alert('Will come soon..');
    let errorFound = false;
    this.errMsg = '';
    this.authStatusMsgs = {};
    console.log(this.orgSignUpForm.value);
    console.log(this.orgSignUpForm);
    try{
      if (!this.orgSignUpForm.valid){
        console.log('NOT VALID');
        this.orgSignUpForm.get('firstName').markAsTouched();
        this.orgSignUpForm.get('lastName').markAsTouched();
        this.orgSignUpForm.get('email').markAsTouched();
        this.orgSignUpForm.get('password').markAsTouched();
        this.orgSignUpForm.get('organizationName').markAsTouched();
        errorFound = true;
      } else {
        console.log('VALID');
        if (this.orgFetchStatus === this.fetchStatus.COMPLETED && this.orgsList.length > 0) {
          const index = this.orgsList.findIndex(org => org.name === this.orgSignUpForm.get('organizationName').value);
          if (index === -1){
            throw new Error('Please select valid organization from list.');
          }
        } else if (this.orgFetchStatus === this.fetchStatus.COMPLETED && this.orgsList.length === 0) {
          // throw new Error('No organization matches with the search string.');
          throw new Error('Your org name is not registered with FuseEarth. Please contact your org admin or register a new org below.');
        } else {
          throw new Error('Please select organization from list.');
        }
      }
    } catch (e){
      errorFound = true;
      this.errMsg = e;
      console.log(this.orgSignUpForm.value);
    }

    if (!errorFound){
      console.log('All GOOD');
      console.log(this.orgSignUpForm.value);
      const data = this.orgSignUpForm.value;
      const credentials = {
        name: this.commonService.getFullNameFromFirstAndLastName(data.firstName, data.lastName),
        email: data.email,
        password: data.password
      };
      this.spinner.show();
      this.firebaseAuth.createUserWithEmailAndPassword(credentials.email, credentials.password, credentials.name)
        .then(res => {
            console.log('USER CREATE SUCCESS');
            console.log(res);
            // API CALL TO ADD THIS USER UNDER ORGANIZATION.
            // IF THROWS ANY ERROR. DELETE THE USER FROM FIREBASE.
            const orgUserData = {
              description : data.organizationName,
              email : data.email,
              name : this.commonService.getFullNameFromFirstAndLastName(data.firstName, data.lastName),
              organizationName : data.organizationName,
              organizationRole : null
            };
            console.log(orgUserData);
            this.firebaseAuth.createUserUnderAnOrg(orgUserData)
                  .subscribe(result => {
                    console.log('ORG USER REGISTRATION SUCCESS');
                    console.log(result);
                    this.mainPage = this.mainPages.THNX_SIGN_IN_UP;
                    this.spinner.hide();
                  }, error => {
                    console.log('ERROR WHILE REGISTERING ORG USER');
                    console.log(error);
                    // res.user.delete();
                    this.spinner.hide();
                    let msg = '';
                    try{
                      if (error.error.message === 'PERSON_ALREADY_REGISTERED_WITH_THIS_EMAIL_ID'){
                        msg = 'This user already member of this/ another organization. Try with another email.';
                      } else {
                        msg = error.error.message || 'Unknown error...';
                      }
                    } catch (e){
                      msg = 'Error while creating user under and org';
                    }
                    if (error.status === 0){
                      msg = 'Server down, Please try again after some time.';
                    }
                    this.errMsg = msg;
                  });

        }, error => {
            console.log(error);
            console.log('USER CREATE FAILED');
            if (error.code === 'auth/email-already-in-use'){
              console.log('The email address is already in use by another account.');
              this.errMsg = 'The email address is already in use by another account.';
            } else {
              this.errMsg = error.code || 'Unknown Error';
            }
            this.spinner.hide();
        }).catch(err => {
            console.log('USER CREATE FAILED');
            if (err.code === 'auth/email-already-in-use'){
              console.log('The email address is already in use by another account.');
              this.errMsg = 'The email address is already in use by another account.';
            } else {
              this.errMsg = err.code || 'Unknown Error';
            }
            this.spinner.hide();
            console.log(err);
        });
    }
  }

  sendEmailVerifiction(): void{
    this.sentActivationLink = '';
    this.emailVerified = '';
    this.spinner.show();
    this.firebaseAuth.sendEmailVerificationToCurrentUser()
          .then(res => {
              console.log('email verification link sent');
              console.log(res);
              setTimeout(() => {
                this.sentActivationLink = 'Email verification link has been sent..';
              }, 3000);
              this.spinner.hide();
          }, error => {
              this.spinner.hide();
              if (error.code !== 'auth/user-token-expired') {
                this.sentActivationLink = 'Email verification link has been sent..';
              } else {
                this.errMsg = 'Unknown Error';
              }
              console.log(error);
          })
          .catch(err => {
              console.log(err);
              this.errMsg = err.code;
          });
  }

  loginWithGoogle(op: string): void{
    console.log('IN loginWithGoogle');
    console.log(op);
    if (op === 'signIn') {
      this.firebaseAuth.doFirebaseGoogleLogin(op);
      this.closeLogin.emit('close');
    } else if (op === 'signUp') {
      window.alert('Will come soon...');
    }
  }

  createOrganization(): void{
    console.log('IN createOrganization');
    this.createOrg.emit('create');
  }


  onSiteSearchChanged(event): void{
    console.log('In onSiteSearchChanged');
    console.log('Name', event);
    const searchKey = event.target.value;
    console.log(searchKey);
    this.orgFetchStatus = this.fetchStatus.UNKNOWN;
    this.displayTeamsList = true;
    this.orgsList = [];
    if (this.commonService.isValid(searchKey)) {
      console.log('VALID');
      if (searchKey.length > 1){
        console.log(searchKey.length);
        console.log(this.orgSearchObserver);
        this.orgSearchObserver.next({str: searchKey, ts: String(new Date().getTime())});
      } else if (searchKey.length <= 1){
        console.log('LESS : ', searchKey.length);
        this.orgSearchObserver.next({str: '', ts: String(new Date().getTime())});
      }
    } else{
      this.displayTeamsList = true;
      console.log('NOT VALID');
      this.orgSearchObserver.next({str: '', ts: String(new Date().getTime())});
    }
  }

  monitorChangesOrganizationName(): void{
    this.orgSearchObserver.asObservable().pipe(
      debounceTime(1000),
      distinctUntilChanged(),
      switchMap((change: any) => {
        console.log(change);
        const searchKey = change.str;
        console.log(searchKey);
        if (this.commonService.isValid(searchKey)) {
          this.orgFetchStatus = this.fetchStatus.INPROGRESS;
          return this.firebaseAuth.getOrganizationsWithSearchStr(searchKey);
        } else {
          return [];
        }
      })
    ).subscribe((data: any) => {
        console.log('GOT ORGANIZATIONS');
        console.log(data);
        // this.orgSearchCompleted = true;
        this.orgsList = data;
        this.orgFetchStatus = this.fetchStatus.COMPLETED;
        // this.orgSearchObserver.next('');
    }, error => {
      console.log('ERROR WHILE GETTING ORGANIZATIONS');
      console.log(error);
      // this.orgSearchObserver.next('');
      this.orgsList = [];
      this.orgFetchStatus = this.fetchStatus.COMPLETED;
      if (error.status === 0){
        this.errMsg = 'Server down, Please try again after some time.';
      }
    });
  }

  onFocusOrgName(event): void{
    console.log('IN FOCUS');
    console.log(event);
    this.displayTeamsList = true;
  }
  onFocusOut(event): void{
    console.log('IN BLUR');
    console.log(event);
    this.displayTeamsList = false;
  }
  mouseInFunc(event): void{
    console.log('In mouseInFunc');
    this.showTeamList = true;
  }
  mouseOutFunc(event): void{
    console.log('In mouseOutFunc');
    this.showTeamList = false;
  }

  selectOrg(selectedOrg): void{
    console.log('In select team');
    console.log(selectedOrg);
    this.displayTeamsList = false;
    this.showTeamList = false;
    this.orgSignUpForm.get('organizationName').setValue(selectedOrg.name);
  }
  openPage(page: string): void{
    this.showPage.emit(page);
  }
  showpackagepagefun(){
    this.showpackagepage=true;
    this.showsignuppage=false;
  }
  Selectexploremonth(e){
    this.selectedexploremonth=e;
    this.selectedexpplanprice=this.exploreplan[0]["amount"]
    console.log(this.exploreplan[1]["month"])
    console.log( this.selectedexpplanprice)
    for(let x=0;x<this.exploreplan.length;x++){
      if(this.exploreplan[x]["month"]==e){
        this.selectedexpplanprice=this.exploreplan[x]["amount"]
      }
     
    }
  //   for(let x=0;x<this.exploreplan.length;x++){
  //   if(this.exploreplan[e][0]==e){
  //     this.selectedexpplanprice=this.exploreplan[e][1];
  //     console.log(this.selectedexpplanprice);
  //   }
  // }
}
Selectengagemonth(e){
  this.selectedengagemonth=e;
  this.selectedengageprice=this.engageplan[0]["amount"]
  console.log(this.engageplan[1]["month"])
  console.log( this.selectedengageprice)
  for(let x=0;x<this.engageplan.length;x++){
    if(this.engageplan[x]["month"]==e){
      this.selectedengageprice=this.engageplan[x]["amount"]
    }
   
  }
//   for(let x=0;x<this.exploreplan.length;x++){
//   if(this.exploreplan[e][0]==e){
//     this.selectedexpplanprice=this.exploreplan[e][1];
//     console.log(this.selectedexpplanprice);
//   }
// }
}
  selectexplorepack(){
    this.showstartertick=false;
    this.showexploretick=true;
    this.showengagetick=false;
    console.log("Selected pack = Explore")
    console.log("Selected months =", this.selectedexploremonth);
    console.log("Price = ", this.selectedexpplanprice)
  }
  selectengagepack(){
    this.showstartertick=false;
    this.showexploretick=false;
    this.showengagetick=true;
    console.log("Selected pack = Engage")
    console.log("Selected months =", this.selectedengagemonth);
    console.log("Price = ", this.selectedengageprice)
  }
}

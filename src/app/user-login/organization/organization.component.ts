import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CommonService, ElementType } from 'src/app/Services/common.service';
import { SocialAuthService } from 'src/app/Services/socialAuthService';
import { CustomSpinner } from 'src/app/Services/SpinnerService';
declare var $: any;

export class WizardPage{
  index: number;
  id: string;
  name: string;
  active: boolean;
  disabled: boolean;
  valid: boolean;
  first: boolean;
  last: boolean;
  form: FormGroup;
}
@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss']
})
export class OrganizationComponent implements OnInit {


  @Output() closeLogin: EventEmitter<any> = new EventEmitter<any>();
  @Output() showPage: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('subscborder', {static: true}) subscborder: ElementRef<HTMLDivElement>;
  orgDetailsForm = new FormGroup({
    orgName: new FormControl('', [Validators.required, Validators.minLength(4)]), // Validators.pattern("[A-Za-z0-9]")]),
    orgAddress: new FormControl('', [Validators.required, Validators.minLength(4)]), // Validators.pattern("[A-Za-z0-9]")]),
    orgType: new FormControl('', [Validators.required, Validators.minLength(4)]),
    city: new FormControl('', [Validators.required, Validators.minLength(2)]),
    country: new FormControl('', [Validators.required, Validators.minLength(2)]),
    postalCode: new FormControl('', [Validators.required, Validators.minLength(5)])
  });

  // var regularExpression = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/;
  adminDetailsForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.minLength(1)]), // Validators.pattern("[A-Za-z0-9]")]),
    lastName: new FormControl('', [Validators.required, Validators.minLength(1)]), // Validators.pattern("[A-Za-z0-9]")]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  emailVerifyForm = new FormGroup({
    otp: new FormControl('', [Validators.required, Validators.minLength(4)])
  });
  menus: Array<WizardPage> = [];
  activeWizard: WizardPage;
 
  orgSearchObserver: Subject<any> = new Subject<any>();
  orgStatus = {
    VALID: 'VALID',
    INVALID: 'INVALID',
    INPROGRESS: 'INPROGRESS',
    UNKNOWN: ''
  };
  validOrg = this.orgStatus.UNKNOWN;
  orgSearchCompleted: boolean;
  errMsg = '';
  operationStatus = '';
  countryList: Array<string> = this.commonService.getCountryList();
  orgTypesList: Array<any> = [
    { name: 'Default', value: 'DEFAULT'},
    // { name: 'Type1', value: 'TYPE1'},
    // { name: 'Type2', value: 'TYPE2'},
    // { name: 'Type3', value: 'TYPE3'}
  ];
  showmenue: string[];
  months: string[];
  exploreplan: any;
  selectedexpplanprice: any;
  engageplan: any;
  selectedengageprice: string;
  subscplanForm: FormGroup;
  paymentdetails: FormGroup;
  showstartertick=false;
  showexploretick=false;
  showengagetick=false;
  selectedmonth: any;
  selectedengagemonth: any;
  selectedexploremonth: any;

  constructor(private commonService: CommonService, private socialAuth: SocialAuthService,
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
    this.menus = [
      { index: 1, id: 'ORG_DETAILS', name: 'Organization Details', form: this.orgDetailsForm,
        disabled: false, active: true, valid: false, first: true, last: false },
      { index: 2, id: 'ADMIN_DETAILS', name: 'Administrator Details', form: this.adminDetailsForm,
        disabled: false, active: false, valid: false, first: false, last: false },
      { index: 3, id: 'EMAIL_VER', name: 'Email Verification', form: this.emailVerifyForm,
        disabled: false, active: false, valid: false, first: false, last: true },
       
        { index: 4, id: 'SUBSC_PLAN', name: 'Subscription Plan Details', form: this.subscplanForm,
        disabled: false, active: false, valid: false, first: false, last: true },
        { index: 5, id: 'PAYMENT_DETAILS', name: 'Payment Details', form: this.paymentdetails,
        disabled: false, active: false, valid: false, first: false, last: true },
      // { index: 4, id: 'SUBS_PLAN', name: 'Subscrition Plan Details', active: false, valid: false, first: false, last: false },
      // { index: 5, id: 'PAYMENT_DETAILS', name: 'Payment Details', active: false, valid: false, first: false, last: true }
    ];
    this.showmenue=['ORG_DETAILS','ADMIN_DETAILS','EMAIL_VER','SUBSC_PLAN','PAYMENT_DETAILS'];
    this.activeWizard = this.menus[0];
    this.orgDetailsForm.get('orgType').setValue('DEFAULT');
    this.orgDetailsForm.valueChanges.subscribe(res => {
      // console.log(this.orgDetailsForm.valid);
      if (!this.orgDetailsForm.valid){
        this.errMsg = '';
      }
    });
    this.orgDetailsForm.get('orgName').valueChanges.subscribe(res => {
      this.validOrg = this.orgStatus.UNKNOWN;
    });
    this.adminDetailsForm.valueChanges.subscribe(res => {
      // console.log(this.adminDetailsForm.valid);
      if (!this.adminDetailsForm.valid){
        this.errMsg = '';
      }
    });
    // this.monitorChangesOrganizationName();
    // this.orgDetailsForm.get('orgName').valueChanges
    //       .subscribe(searchKey => {
    //         console.log('Org name changed...');
    //         console.log(searchKey);
    //         this.validOrg = this.orgStatus.UNKNOWN;
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

  setAdminPage(): void{
    const index = this.menus.findIndex(val => val.id === this.activeWizard.id);
    if (index !== -1){
      this.activeWizard.active = false;
      this.menus[index] = this.activeWizard;
    }

    const index1 = this.menus.findIndex(val => val.id === 'ADMIN_DETAILS');
    if (index1 !== -1){
      // this.menus[index1] = this.activeWizard;
      this.activeWizard = this.menus[index1];
      this.activeWizard.active = true;
    }
  }
  showNextPage(): void{
    const index = this.menus.findIndex(val => val.id === this.activeWizard.id);
    if (index !== -1){
      this.activeWizard.active = false;
      this.menus[index] = this.activeWizard;
      this.activeWizard = this.menus[index + 1];
      this.activeWizard.active = true;
    }
    if (this.activeWizard.id === 'EMAIL_VER'){
      console.log('EMAIL VER PAGE...');
      this.createOrganizationWithAdmin();
    }
  }
  showPreviousPage(): void{
    const index = this.menus.findIndex(val => val.id === this.activeWizard.id);
    if (index !== -1){
      this.activeWizard.active = false;
      this.menus[index] = this.activeWizard;
      this.activeWizard = this.menus[index - 1];
      this.activeWizard.active = true;
    }
  }

  // monitorChangesOrganizationName(): void{
  //   this.orgSearchObserver.asObservable().pipe(
  //     debounceTime(1000),
  //     distinctUntilChanged(),
  //     switchMap((change: any) => {
  //       console.log(change);
  //       const orgNameMatchKey = change.str;
  //       console.log(orgNameMatchKey);
  //       if (this.commonService.isValid(orgNameMatchKey)) {
  //         this.orgSearchCompleted = false;
  //         this.validOrg = this.orgStatus.INPROGRESS;
  //         return this.socialAuth.getOrganizationsWithSearchStr(orgNameMatchKey);
  //       } else {
  //         return [];
  //       }
  //     })
  //   ).subscribe((data: any) => {
  //       console.log('GOT ORGANIZATIONS');
  //       console.log(data);
  //       this.orgSearchCompleted = true;
  //       if (data.length > 0){
  //         this.validOrg = this.orgStatus.INVALID;
  //       } else {
  //         this.validOrg = this.orgStatus.VALID;
  //         if (this.activeWizard.form.valid) {
  //           this.activeWizard.valid = true;
  //         } else{
  //           this.activeWizard.valid = false;
  //         }
  //       }
  //       // this.orgSearchObserver.next('');
  //   }, error => {
  //     console.log('ERROR WHILE GETTING ORGANIZATIONS');
  //     console.log(error);
  //     // this.orgSearchObserver.next('');
  //     this.orgSearchCompleted = true;
  //     this.validOrg = this.orgStatus.INVALID;
  //   });
  // }

  getOrganizationsWithStr(orgNameMatchKey): void{
    if (this.commonService.isValid(orgNameMatchKey) && orgNameMatchKey.length > 2) {
    this.orgSearchCompleted = false;
    this.validOrg = this.orgStatus.INPROGRESS;
    this.errMsg = '';
    this.socialAuth.getOrganizationsWithName(orgNameMatchKey)// getOrganizationsWithSearchStr(orgNameMatchKey)
          .subscribe((data: any) => {
            console.log('GOT ORGANIZATIONS');
            console.log(data);
            this.orgSearchCompleted = true;
            if (this.commonService.isValid(data)){
              this.validOrg = this.orgStatus.INVALID;
            } else {
              this.validOrg = this.orgStatus.VALID;
              if (this.activeWizard.form.valid) {
                this.activeWizard.valid = true;
              } else{
                this.activeWizard.valid = false;
              }
            }
            this.errMsg = '';
            // if (data.length > 0){
            //   this.validOrg = this.orgStatus.INVALID;
            // } else {
            //   this.validOrg = this.orgStatus.VALID;
            //   if (this.activeWizard.form.valid) {
            //     this.activeWizard.valid = true;
            //   } else{
            //     this.activeWizard.valid = false;
            //   }
            // }
        }, error => {
          console.log('ERROR WHILE GETTING ORGANIZATIONS');
          console.log(error);
          // this.orgSearchObserver.next('');
          this.orgSearchCompleted = true;
          this.validOrg = this.orgStatus.UNKNOWN; // INVALID;
          if (error.status === 0){
            this.errMsg = 'Server down, Please try again after some time.';
          }
        });
    }
  }

  onSubmit(form: FormGroup): void{
    // TODO: Use EventEmitter with form value
    this.errMsg = '';
    if (form.valid){

      if (this.activeWizard.id === 'ORG_DETAILS'){
        console.log('ORG DETAILS WIZARD...');
        if (this.validOrg === this.orgStatus.VALID){
          this.activeWizard.valid = true;
        } else if (this.validOrg === this.orgStatus.INPROGRESS){
          this.activeWizard.valid = false;
          this.errMsg = 'Please wait. Checking for organization name.';
        } else {
          this.activeWizard.valid = false;
          this.errMsg = 'Please enter valid organization name.';
        }
      } else if (this.activeWizard.id === 'ADMIN_DETAILS'){
        console.log('ADMIN DETAILS WIZARD...');
        if (form.get('password').value !== form.get('confirmPassword').value){
          this.errMsg = 'Password not matching.';
          this.activeWizard.valid = false;
        } else {
          this.activeWizard.valid = true;
        }
      } else {
        console.log('OTHER WIZARD...');
        console.log(this.orgDetailsForm.value);
        console.log(this.adminDetailsForm.value);
        this.activeWizard.valid = true;
      }

      // MOVE TO NEXT STEP
      if (this.activeWizard.valid && !this.activeWizard.last){
        this.showNextPage();
      } else {
        // THIS IS FINAL STEP
      }
      console.log(this.activeWizard);
      console.log(this);
    } else {
      // STAY THERE
    }

  }
  createUserAccountInFirebase(): void{
    const data = this.adminDetailsForm.value;
    const credentials = {
      name: this.commonService.getFullNameFromFirstAndLastName(data.firstName, data.lastName),
      email: data.email,
      password: data.password
    };
    const orgFormData = this.orgDetailsForm.value;
    console.log(data);
    console.log(credentials);
    const orgData = {
      organizationInfo : {
        organizationId : null,
        description : `${orgFormData.orgName} Description`,
        name : orgFormData.orgName,
        url : null,
        status : 'Active',
        address : orgFormData.orgAddress,
        type : orgFormData.orgType,
        city : orgFormData.city,
        country : orgFormData.country,
        postalCode : orgFormData.postalCode
      },
      userSignUpInfo : {
        description : '',
        email : data.email,
        name : this.commonService.getFullNameFromFirstAndLastName(data.firstName, data.lastName),
        organizationName : orgFormData.orgName,
        organizationRole : null
      }
    };
    console.log(orgData);
    this.spinner.show();
    this.socialAuth.createUserWithEmailAndPassword(credentials.email, credentials.password, credentials.name)
      .then(res => {
          console.log('USER CREATE SUCCESS');
          console.log(res);
          this.callOrganizationWithAdminAPI(orgData);
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

          this.setAdminPage();
          this.activeWizard.valid = false;
          this.activeWizard.disabled = false;
          this.operationStatus = '';

      }).catch(err => {
          console.log('USER CREATE FAILED');
          if (err.code === 'auth/email-already-in-use'){
            console.log('The email address is already in use by another account.');
            this.errMsg = 'The email address is already in use by another account.';
          } else {
            this.errMsg = err.code || 'Unknown Error';
          }
          this.spinner.hide();

          this.setAdminPage();
          this.activeWizard.valid = false;
          this.activeWizard.disabled = false;
          this.operationStatus = '';

          console.log(err);
      });

    // // FOR ERROR..
    // const msg = 'User already exist with the email. Try with another email for admin.';
    // this.operationStatus = 'failed';
    // this.activeWizard.valid = false;
    // this.setAdminPage();
    // this.adminDetailsForm.get('email').reset();
    // this.errMsg = msg;
    // this.operationStatus = '';

    // // ALL SUCCESS
    // this.operationStatus = 'success';
    // this.activeWizard.disabled = false;
    // this.activeWizard.valid = true;
    // this.spinner.hide();
  }

  callOrganizationWithAdminAPI(orgData): void{
    console.log('callOrganizationWithAdminAPI');
    console.log(orgData);
    this.socialAuth.createOrganizationAndAdmin(orgData)
          .subscribe((data: any) => {
            console.log('ORGANIZATION WITH ADMIN CREATED...');
            console.log(data);
            this.operationStatus = 'success';
            this.activeWizard.disabled = false;
            this.activeWizard.valid = true;
            this.spinner.hide();
          }, error => {
            console.log('ERROR WHILE CREATING ORGANIZATION WITH ADMIN...');
            console.log(error);
            let msg = '';
            if (error.error.message === 'PERSON_ALREADY_REGISTERED_WITH_THIS_EMAIL_ID'){
              msg = 'User already exist with the email. Try with another email for admin.';
            } else {
              msg = error.error.message || 'Unknown error...';
            }
            if (error.status === 0){
              msg = 'Server down, Please try again after some time.';
            }
            this.activeWizard.valid = false;
            this.activeWizard.disabled = false;
            this.setAdminPage();
            this.adminDetailsForm.get('email').reset();
            this.errMsg = msg;
            this.operationStatus = '';
            this.spinner.hide();
          });

  }
  createOrganizationWithAdmin(): void{
    console.log('WILL CALL APIS...');
    if (this.operationStatus === '') {
      console.log('CREATING ACCOUNT');
      this.activeWizard.disabled = true;
      // setTimeout(() => {
        // this.activeWizard.disabled = false;
      this.createUserAccountInFirebase();
      // }, 5000);
    } else {
      console.log('ALREADY SUBMITTED');
    }
  }

  closeWindow(): void{
    console.log('Close window...');
    this.closeLogin.emit('close');
  }

  changePage(e): void{
    console.log(e);
    // this.page = any;
    // console.log(any.value);
    // console.log(any);
  }

  getErrorMsg(ctrl: FormControl, name: string, type = ElementType.INPUT): string{
    return this.commonService.getFormErrorMsg(ctrl, name, type);
  }

  openPage(page: string): void{
    this.showPage.emit(page);
  }
  process(e){
    console.log(e)
    
        this.menus[0].active=false;
        console.log(this.menus[e-1].name)
        for(let i=1;i<this.menus.length+1;i++){
        if(e==i){
        this.menus[i-1].active=true;
        console.log(this.showmenue[e])
        this.activeWizard.id=this.showmenue[e-1];

        }
        else{
          this.menus[i-1].active=false;
        }
      }
        
      
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
selectstarterpack(e,b){
  this.showstartertick=true;
  this.showexploretick=false;
  this.showengagetick=false;
  console.log("Selected pack = Starter")
  console.log("Selected months =", this.selectedmonth);
  console.log("Price = $ 0",)
    // $(".subscplan").css({"border" : "5px solid white"})
 
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

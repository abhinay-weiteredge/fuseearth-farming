import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonService, ElementType } from '../Services/common.service';
import { SocialAuthService } from '../Services/socialAuthService';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  @Input() userProfile: any = {};
  pwdChangForm: FormGroup;
  defualtImageSrc = '/assets/images/profile.png';
  imageSrc = '/assets/images/profile.png';
  email = '';
  @Input() userInfo: any = {};
  orgType = '';
  orgName = '';
  errMsg = '';
  loggedInMethod = '';
  showUpdateSuccessMsg = false;
  showSavingStatus = false;
  constructor(private commonService: CommonService, private firebaseAuth: SocialAuthService) {
    this.loggedInMethod = localStorage.getItem('provider');
    this.pwdChangForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(1)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(1)]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
      confirmPassword: new FormControl('', [Validators.required, Validators.minLength(8)])
    });
    if (this.loggedInMethod !== 'password'){
      this.pwdChangForm.get('password').setValidators([]);
      this.pwdChangForm.get('confirmPassword').setValidators([]);
    }
    this.email = localStorage.getItem('email');
    const name: string = localStorage.getItem('name');
    if (name.includes(' ')){
      const firstName = name.substr(0, name.indexOf(' '));
      const lastName = name.substr(name.indexOf(' ') + 1);
      this.pwdChangForm.get('firstName').setValue(firstName);
      this.pwdChangForm.get('lastName').setValue(lastName);
    } else{
      this.pwdChangForm.get('firstName').setValue(name);
    }
    const photo = localStorage.getItem('photo');
    if (this.commonService.isValid(photo)) {
      this.imageSrc = photo;
    }
  }

  ngOnInit(): void {
    console.log(this);
    this.orgName = this.userProfile.orgInfo.name;
    this.orgType = this.userProfile.orgInfo.name  === 'FuseEarth' ? 'INDEPENDENT' : 'ORG';
  }

  getErrorMsg(ctrl: FormControl, name: string, type = ElementType.INPUT): string{
    return this.commonService.getFormErrorMsg(ctrl, name, type);
  }

  updatePassword(): void{
    console.log('In Update pwd');
    let errorFound = false;
    this.errMsg = '';
    console.log(this.pwdChangForm.value);
    this.showUpdateSuccessMsg = false;
    try{
      if (!this.pwdChangForm.valid){
        this.pwdChangForm.get('firstName').markAsTouched();
        this.pwdChangForm.get('lastName').markAsTouched();
        this.pwdChangForm.get('confirmPassword').markAsTouched();
        this.pwdChangForm.get('password').markAsTouched();
        errorFound = true;
      } else if (this.loggedInMethod === 'password' && (this.pwdChangForm.get('confirmPassword').value !==
                  this.pwdChangForm.get('password').value)){
        throw new Error('Password not matching');
      }
    } catch (e){
      errorFound = true;
      this.errMsg = e;
      setTimeout(() => {
        this.errMsg = "";
      }, 5000);
    }
    if (!errorFound){
      console.log('UPDATE NAME AND PASSWORD');
      const data = this.pwdChangForm.value;
      console.log(data);
      const displayName = this.commonService.getFullNameFromFirstAndLastName(data.firstName, data.lastName);
      this.showSavingStatus = true;
      this.firebaseAuth.updateDisplayName(displayName)
            .then(res => {
              console.log('display name updated');
              console.log(res);
              localStorage.setItem('name', displayName);
              if (this.loggedInMethod === 'password'){
                this.firebaseAuth.updatePassword(data.password)
                      .then(res1 => {
                        console.log('password updated');
                        console.log(res1);
                        this.showSuccessMsg();
                        this.showSavingStatus = false;
                      }).catch(err => {
                        console.log('error while updating password');
                        console.log(err);
                        // if (err.code === 'auth/requires-recent-login'){

                        // }
                        this.errMsg = err.message;
                        this.showSavingStatus = false;
                        setTimeout(() => {
                          this.errMsg = "";
                        }, 5000);
                      });
              } else {
                this.showSuccessMsg();
                this.showSavingStatus = false;
              }
            }).catch(err => {
              console.log('error while updating display name');
              console.log(err);
              this.errMsg = err.message;
              this.showSavingStatus = false;
              setTimeout(() => {
                this.errMsg = "";
              }, 5000);
            });

    }
  }
  showSuccessMsg(): void{
    this.showUpdateSuccessMsg = true;
    setTimeout(() => {
      this.showUpdateSuccessMsg = false;
    }, 5000);
  }

}

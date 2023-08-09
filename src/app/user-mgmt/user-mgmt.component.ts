import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { event } from 'jquery';
import { CommonService, ElementType } from '../Services/common.service';
import { SocialAuthService } from '../Services/socialAuthService';

@Component({
  selector: 'app-user-mgmt',
  templateUrl: './user-mgmt.component.html',
  styleUrls: ['./user-mgmt.component.scss']
})
export class UserMgmtComponent implements OnInit {
  data_management= [
    [{ value: 'ViewAll', label: 'View All', url:"../../assets/svgs/tick.svg" },
    { value: 'AddEverything', label: 'Add(Everything)', url:"../../assets/svgs/tick.svg" },
    { value: 'AddGeometry', label: 'Add(Geometry)', url:"../../assets/svgs/tick.svg"},
    { value: 'AddAttributes', label: 'Add(Attributes)', url:"../../assets/svgs/tick.svg" },
    { value: 'Copy', label: 'Copy', url:"../../assets/svgs/tick.svg" },
    { value: 'Share', label: 'Share', url:"../../assets/svgs/tick.svg" }],

    [{ value: 'ViewAll', label: 'View All', url:"../../assets/svgs/tick.svg" },
    { value: 'AddEverything', label: 'Add(Everything)', url:"../../assets/svgs/cross.svg" },
    { value: 'AddGeometry', label: 'Add(Geometry)', url:"../../assets/svgs/cross.svg"},
    { value: 'AddAttributes', label: 'Add(Attributes)', url:"../../assets/svgs/cross.svg" },
    { value: 'Copy', label: 'Copy', url:"../../assets/svgs/tick.svg" },
    { value: 'Share', label: 'Share', url:"../../assets/svgs/tick.svg" }],

    [{ value: 'ViewAll', label: 'View All', url:"../../assets/svgs/tick.svg" },
    { value: 'AddEverything', label: 'Add(Everything)', url:"../../assets/svgs/tick.svg" },
    { value: 'AddGeometry', label: 'Add(Geometry)', url:"../../assets/svgs/tick.svg"},
    { value: 'AddAttributes', label: 'Add(Attributes)', url:"../../assets/svgs/tick.svg" },
    { value: 'Copy', label: 'Copy', url:"../../assets/svgs/cross.svg" },
    { value: 'Share', label: 'Share', url:"../../assets/svgs/tick.svg" }],

    [{ value: 'ViewAll', label: 'View All', url:"../../assets/svgs/tick.svg" },
    { value: 'AddEverything', label: 'Add(Everything)', url:"../../assets/svgs/cross.svg" },
    { value: 'AddGeometry', label: 'Add(Geometry)', url:"../../assets/svgs/cross.svg"},
    { value: 'AddAttributes', label: 'Add(Attributes)', url:"../../assets/svgs/cross.svg" },
    { value: 'Copy', label: 'Copy', url:"../../assets/svgs/cross.svg" },
    { value: 'Share', label: 'Share', url:"../../assets/svgs/cross.svg" }]

  ]
  
  dataManagementCustom=[
    { value: 'ViewAll', label: 'View All',checked:false, id:1 },
    { value: 'AddEverything', label: 'Add(Everything)',checked:false, id:2 },
    { value: 'AddGeometry', label: 'Add(Geometry)',checked:false, id:3},
    { value: 'AddAttributes', label: 'Add(Attributes)',checked:false, id:4 },
    { value: 'Copy', label: 'Copy',checked:false, id:5 },
    { value: 'Share', label: 'Share',checked:false, id:6 }
  ]

  userRoleOptions = [
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Supervisor', label: 'Supervisor' },
    { value: 'Contributor', label: 'Contributor' },
    { value: 'Viewer', label: 'Viewer' }
   
  ];

  approveStatus = [
    { value: 'ApproveActive', label: 'Approve & Active' },
    { value: 'ApproveInactive', label: 'Approve & Inactive' },
    { value: 'Reject', label: 'Reject' },
    { value: 'Onhold', label: 'Onhold' }
   
  ];
  userRoleSelectedValue = "Administrator";
  userRoleSelectedValueEditUser = "Administrator";
  dataManagementGroup = this.data_management[0];
  dataRightsSelected = "Group";
  activeStatus = "Active";
  approveStatusSelected = "Approve & Active";
  showGroupTable = true;
  showGroupTableEditUser = true;
  showComments: boolean;
  showCustomTable: boolean;
  showCustomTableEditUser: boolean;
  customSelectedRightsArray: Array<any> = [];
  registerForm: FormGroup;
  submitted = false;
  updated = false;
  addUserHide: boolean;
  editUserHide: boolean;
  @Input() userProfile: any = {};
  showdeleteuser:boolean;
  allUsers: any;
  usersDataCollected = false;
  operation = '';
  selectedUser: any = {};
  userForm: FormGroup;
  usertodelete: boolean =true;
  dataRightsList: Array<any> = [
    { name: 'Group', value: 'GROUP'},
    { name: 'Custom', value: 'CUSTOM'}
  ];
  userRolesList: Array<any> = [
    { name: 'Administrator', value: 'Administrator' },
    { name: 'Supervisor', value: 'Supervisor' },
    { name: 'Contributor', value: 'Contributor' },
    { name: 'Viewer', value: 'Viewer' }
  ];
  TotalCheck: boolean;
  Array: string;
  SaveAddUser: any;
  data = [];
  editUserEmail = [];
  addUserFirstName: any;
  searchfil: any;
  finalfilter: any[];
  searchfilter2: any[];
  add_user_show(){
    this.addUserHide = !this.addUserHide;
    this.editUserHide = false;
    this.showdeleteuser = false;
  }
  edit_user_show(){
    this.editUserHide = !this.editUserHide;
    this.addUserHide = false;
    this.showdeleteuser = false;
  }
  showdeleteconfirm(){
    this.showdeleteuser=!this.showdeleteuser
    this.addUserHide = false;
    this.editUserHide = false;
  }
  userStatusList: Array<any> = [];
  errMsg  = '';
  savingStatus = '';
  idarray: any[]= [];

  constructor(private socialAuth: SocialAuthService, private commonService: CommonService, private formBuilder: FormBuilder) {
    this.userForm = new FormGroup({
      firstName: new FormControl('', [Validators.required]),
      lastName: new FormControl('', [/*Validators.required*/]),
      email: new FormControl('', [Validators.required, Validators.email]),
      dataRights: new FormControl(''), // , [Validators.required]),
      dataMgmt: new FormControl(''), // , [Validators.required]),
      userRole: new FormControl(''), // , [Validators.required]),
      status: new FormControl('', [Validators.required]),
      comments: new FormControl(''),
    });
  }

  ngOnInit(): void {
    this.getAllUsersOfOrg();
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      Email: ['', [Validators.required, Validators.email]],
      DataRightsOption: ['', Validators.required],
      UserRoleOption: ['', Validators.required],
      activeStatus: ['', Validators.required]
  });
  }

  get f() { return this.registerForm.controls; }

    onSubmit() {
        this.submitted = true;

        // stop here if form is invalid
        if (this.registerForm.invalid) {
            return;
        }
          this.Array = this.registerForm.value;
            this.data.push(this.customSelectedRightsArray)

          const dataSelected = {
            SelectedDataManagement : this.data
          }
        if(this.Array['DataRightsOption'] == 'Group'){
          this.SaveAddUser = this.Array;
        }
        else if(this.Array['DataRightsOption'] == 'Custom'){
          this.SaveAddUser  = Object.assign(this.Array , dataSelected)
        }
        console.log(this.SaveAddUser,"CHECK DAAAAAA")
    }

    onUpdate(){
         this.updated = true;
    }

  getAllUsersOfOrg(): void{
    this.usersDataCollected = false;
    const orgId = this.userProfile.orgInfo.organizationId;
    this.socialAuth.getUserOfAnOrganization(orgId)
          .subscribe(result => {
            console.log('GOT USERS');
            console.log(result);
            const tempUsers: any[] = [];
            result.forEach(element => {
              element.statusToDisplay = this.getStatusText(element.status);
              tempUsers.push(element);
            });
            this.allUsers = tempUsers;
            this.searchfilter2 = tempUsers
            
            this.usersDataCollected = true;
          }, error => {
            console.log('ERROR WHILE GETTING USERS');
            console.log(error);
            this.allUsers = [];
            this.usersDataCollected = true;
          });
  }

  getStatusText(status: string): string{
    try{
      return status.toLowerCase().split('_').join(' ');
    } catch (e){
      return status;
    }
  }

  editUser(user): void{
    this.selectedUser = user;
    const data = {
      firstName: user.firstName || user.name,
      lastName: user.lastName,
      email: user.email,
      dataRights: user.dataRights || '',
      dataMgmt: user.dataMgmt || '',
      userRole: user.userRole || '',
      status: user.status || '',
      comments: user.comments || ''
    };
    if (user.status === 'WAITING_FOR_APPROVAL'){
      this.userStatusList = [
        { name: 'Approve & Active', value: 'APPROVE_AND_ACTIVE'},
        { name: 'Approve & Inactive', value: 'APPROVE_AND_INACTIVE'},
        { name: 'Reject', value: 'REJECT'},
        { name: 'Onhold', value: 'ONHOLD'}
      ];
      data.status = '';
    } else{
      this.userStatusList = [
        { name: 'Active', value: 'ACTIVE'},
        { name: 'Inactive', value: 'INACTIVE'}
      ];
    }
    this.userForm.setValue(data);
    this.userForm.get('firstName').disable();
    this.userForm.get('lastName').disable();
    this.userForm.get('email').disable();
    this.operation = 'update';
  }
  closeEdit(): void{
    this.selectedUser = {};
    this.operation = '';
    this.userForm.reset();
  }
  getErrorMsg(ctrl: FormControl, name: string, type = ElementType.INPUT): string{
    return this.commonService.getFormErrorMsg(ctrl, name, type);
  }
  
  validateSubmit(): void{
    console.log('IN validateSubmit');
    console.log(this.userForm);
    let errorFound = false;
    try{
      if (!this.userForm.valid){
        console.log('NOT VALID');
        this.userForm.get('firstName').markAsTouched();
        this.userForm.get('lastName').markAsTouched();
        this.userForm.get('email').markAsTouched();
        this.userForm.get('status').markAsTouched();

        errorFound = true;
      }
    } catch (e){
      errorFound = true;
      this.errMsg = e;
      setTimeout(() => {
        this.errMsg = "";
      }, 5000);
      console.log(e);
    }

    if (!errorFound){
      console.log('All GOOD');
      console.log(this.userForm.value);
      this.savingStatus = 'inprogress';
      // setTimeout(() => {
      //   // ADD API CALL HERE...

      //   this.savingStatus = 'completed';
      //   this.getAllUsersOfOrg();
      //   this.closeEdit();
      // }, 5000);
      this.updateUserData();
    }
  }

  updateUserData(): void{
    const email = this.userForm.get('email').value;
    let status = this.userForm.get('status').value;
    if (this.userForm.get('status').value === 'APPROVE_AND_ACTIVE') {
      status = 'ACTIVE';
    } else if (this.userForm.get('status').value === 'APPROVE_AND_INACTIVE') {
      status = 'INACTIVE';
    }
    this.socialAuth.updateUserOfAnOrg(email, status)
          .subscribe(result => {
            console.log('USER UPDATE SUCCESS');
            console.log(result);
            this.savingStatus = 'completed';
            this.getAllUsersOfOrg();
            this.closeEdit();
          }, error => {
            console.log('ERROR WHILE UPDATING USER');
            console.log(error);
          });
  }
  CheckAllOptions(e) {
    if (this.allUsers.every(val => val.checked == true))
      this.allUsers.forEach(val => { val.checked = false });
    else
      this.allUsers.forEach(val => { val.checked = true });
      for(let x=0;x<this.allUsers.length;x++){
        this.idarray.push(x);
      }


    console.log(e,"tttttttttttttt");  
      
     
  }
  removeSelectedRows(){
    console.log(this.idarray.length)
    var length = this.idarray.length
    
    for(let x=length-1;x>=0;x--){
     
        this.allUsers.splice(this.idarray[x],1);
        this.idarray.splice(x,1)
        console.log(this.idarray,"ppppppppp") 
    }
    this.showdeleteuser=false;
  }
  checkid(e){
    const editUserEmaildata = this.allUsers[e.target.id].email
    this.editUserEmail.splice(0,this.editUserEmail.length)
    this.editUserEmail.push(editUserEmaildata);
    console.log(this.editUserEmail,"check")

    // const addUserFirstNamedata = this.allUsers[e.target.id].firstName
    // this.addUserFirstName.splice(0,this.addUserFirstName.length)
    // this.addUserFirstName.push(addUserFirstNamedata);
    // console.log(this.addUserFirstName,"check")

    const d=Number(e.target.id)
    
    this.idarray.push(d)
    

  }
  onChangeUserRole(deviceValue) {

    if(deviceValue == 'Administrator'){
      this.dataManagementGroup = this.data_management[0];
    }
    else if(deviceValue == 'Supervisor'){
      this.dataManagementGroup = this.data_management[1];
    }
    else if(deviceValue == 'Contributor'){
      this.dataManagementGroup = this.data_management[2];
    }
    else if(deviceValue == 'Viewer'){
      this.dataManagementGroup = this.data_management[3];
    }
    
}

onChangeDataRights(e){
  if(e == "Group"){
    this.showGroupTable = true;
    this.showCustomTable = false;
  }
  else if(e == "Custom"){
    this.showGroupTable = false;
    this.showCustomTable = true;
  }
  console.log(e, "check right")
}

onChangeDataRightsEditUser(e){
  if(e == "Group"){
    this.showGroupTableEditUser = true;
    this.showCustomTableEditUser = false;
  }
  else if(e == "Custom"){
    this.showGroupTableEditUser = false;
    this.showCustomTableEditUser = true;
  }
  console.log(e, "check right")
}

onChangeApproveStatus(e){
  if(e == "Reject"){
    this.showComments = true;
  }
  else{
    this.showComments = false;
  }
}
customIndividualCheck(data:string, isChecked: boolean) {
  if(isChecked) {
    this.customSelectedRightsArray.push(data);    
  } else {
    let index = this.customSelectedRightsArray.indexOf(data);
    this.customSelectedRightsArray.splice(index,1);
  }
  console.log(this.customSelectedRightsArray,"custom selected individual options");
}

customTotalCheckbox() {
let checkBoxes = document.querySelectorAll<HTMLElement>('.form-check-input');
checkBoxes.forEach(ele => ele.click());
console.log(this.customSelectedRightsArray,"custom selected all options");
}
searchfilter(sval){
  this.allUsers = this.finalfilter2(sval);
}
finalfilter2(sval){
  
  this.searchfil=sval;
  this.searchfil= this.searchfil.toLocaleLowerCase();
  console.log(this.searchfil,"i am search value");
  console.log(this.searchfilter2,"tttttttttt")
   return this.searchfilter2.filter(x => x.email.toLowerCase().includes(this.searchfil));
}

}



function MustMatch(arg0: string, arg1: string): any {
  throw new Error('Function not implemented.');
}


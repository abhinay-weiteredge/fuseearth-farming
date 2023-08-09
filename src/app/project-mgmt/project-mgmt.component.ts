import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgModel, Validators } from '@angular/forms';
import { stringify } from 'querystring';
import { AlertPromise } from 'selenium-webdriver';
@Component({
  selector: 'app-project-mgmt',
  templateUrl: './project-mgmt.component.html',
  styleUrls: ['./project-mgmt.component.scss']
})
export class ProjectMgmtComponent implements OnInit {
  idarray: any[]= [];
  showproject=true;
  showplace= false;
  showtopic= false;
  saveProject = false;
  saveProjectArray: string;
  showProjectNameError:boolean;
  @Input() userProfile: any = {};
  showAddProject = false;
  showEditProject = false;
  SaveAddProject: any;
  projectName : string;
  form: FormGroup;
  data: { projectname: any; userassigned: any; approval: string; };
  users=[];
  continueAdding: boolean;
  notcontinueAdding = true;
  editprojectname: any;
  d8: HTMLCollectionOf<Element>;
  d9: HTMLInputElement;
  editUserAssigned = [];
  
  d12: HTMLInputElement;
  editApproval: any;
  id: any;
  d11=[];
  searchprojects: any;
  searchprojectfil: any;
  Projects: any[];
  PProjects: any[];
  TTopics: any[];
  PPlace: any[];
  Topics: any[];
  Places: any[];
 
  constructor(private formBuilder : FormBuilder) { }
  assignUsersList = [];
    selectedItems:any;
    assignUsersSettings = {};
    addProjectForm: FormGroup;
    Removeprojectconfirm=false;
  Removetopicconfirm=false;
  Removeplaceconfirm=false;
  projectarray: any[]=[];
  placearray: any[]=[];
  topicarray: any[]=[];
  addtopicpopup=false;
  addplacefield=false;
  showsavebutton=false;
  showsavetopicbutton=false;
  editProjectName = [];
  @ViewChild('placename1', {static : true}) placename1: ElementRef<HTMLDivElement>;
  @ViewChild('topicname1', {static : true}) topicname1: ElementRef<HTMLDivElement>;
  @ViewChild('topicchecked', {static : true}) topicchecked: ElementRef<HTMLDivElement>;
  @ViewChild('editProjectName1', {static : true}) editProjectName1: ElementRef<HTMLDivElement>;
  @ViewChild('editProjectUserList', {static : true}) editProjectUserList: ElementRef<HTMLDivElement>;

  
  d2: HTMLCollectionOf<Element>;
 
  
  d3: HTMLCollectionOf<Element>;
  checktest: any;
  d4: HTMLCollectionOf<Element>;
  d5: HTMLCollectionOf<Element>;
  d6: HTMLCollectionOf<Element>;
  d7: HTMLElement;
  ngOnInit(): void {
    this.initForm();
    
    this.assignUsersList = [
      {"id":1,"itemName":"developer.geomocus@gmail.com"},
      {"id":2,"itemName":"tanuja3494@gmail.com"},
      {"id":3,"itemName":"srivas418@gmail.com"},
      {"id":4,"itemName":"naveen@deepgrid.in"}
    ];
this.selectedItems = [];
console.log(this.selectedItems,"angle")
this.assignUsersSettings = { 
          singleSelection: false, 
          text:"Assign Users",
          selectAllText:'Select All',
          unSelectAllText:'UnSelect All',
          enableSearchFilter: true,
          classes:"assignUsers"
        };    
        
        
        this.addProjectForm = this.formBuilder.group({
          projectName: ['', Validators.required]
      });
      this.PProjects=this.projects;
      this.TTopics=this.topics;
      this.PPlace=this.places;
  }

  get f() { return this.addProjectForm.controls; }

  saveAddProject() {
    for(let i=0;i<this.projects.length;i++){
      console.log(this.projectName , this.projects[i]['projectname'],"check")
      console.log(typeof(this.projectName) , typeof(this.projects[i]['projectname']),"check type")
      if(this.projectName == this.projects[i]['projectname']){
                   this.notcontinueAdding = false;
                   console.log(this.notcontinueAdding,"number1")
                   
      }
     
      console.log(this.notcontinueAdding,"number2")
    }
    console.log(this.notcontinueAdding,"number3")
         if(this.notcontinueAdding == false){
          console.log(this.notcontinueAdding,"number4")
          console.log("yes")
          this.showAddProject = true;
          this.notcontinueAdding = true;
          this.showProjectNameError = true;
         }
        
        else if(this.notcontinueAdding == true){
          this.showProjectNameError = false;
          console.log(this.notcontinueAdding,"number5")
          console.log("yyyyy")
          this.showAddProject = false;
          this.saveProjectArray = this.projectName;

        for(let i=0;i<this.selectedItems.length;i++){
          this.users.push(this.selectedItems[i]['itemName'])
        }
        this.data ={
          projectname: this.saveProjectArray , 
          userassigned: this.users,
          approval:this.activeApproveOption
        }
        console.log(this.data,"save add project")
         
      
      this.projects.push(this.data)
      this.projectName=null;
      this.activeApproveOption =  "../../assets/images/unlock.png";
      this.selectedItems = null;
      this.users = [];
        }
      
    }


    saveEditProject(){
      this.showEditProject = false;
      this.projects.forEach(x => x.state = false)
         
        
         this.d9 = document.getElementById(this.editprojectname) as HTMLInputElement | null;
         let d10= this.d9?.value;
        this.projects[this.projectarray[0]].projectname=d10;
       
        //////////////////////////////////////////////////////////////
        for(let i=0;i<this.selectedItems.length;i++){
          this.d11.push(this.selectedItems[i]['itemName'])
        }
       
       this.projects[this.projectarray[0]].userassigned=this.d11;
      
       this.d11=[];
        
       ///////////////////////////////////////////////////////////////////

       this.d12 = document.getElementById(this.editApproval) as HTMLInputElement | null;
       let d13= this.d12?.src;
       this.projects[this.projectarray[0]].approval=d13;

       //////////////////////////////////////////////////////////////
      this.projectarray.splice(0,this.projectarray.length);
     
      this.selectedItems=null;
      this.projectName=null;
      this.activeApproveOption =  "../../assets/images/unlock.png";
    }

  onItemSelect(item:any){
    console.log(item);
    console.log(this.selectedItems,"angle");
}
OnItemDeSelect(item:any){
    console.log(item);
    console.log(this.selectedItems);
}
onSelectAll(items: any){
    console.log(items);
}
onDeSelectAll(items: any){
    console.log(items);
}
 initForm(){
  this.form = this.formBuilder.group({
    grocery : ['',[Validators.required]]
  })
 }
  contentdropdown:boolean = false;
 
  activeApproveOption:string = "../../assets/images/unlock.png"
  altactiveApproveOption:string = "UNLOCK"
  colorVariable: number = 0;
  editProjectApproveOptions:any[] = [
    {
      id:0,src: "../../assets/images/unlock.png",alt:"UNLOCK"
    },
    {
      id:1,
      src: "../../assets/images/lock.png",
      alt:"LOCK"
    }
  ]

  dropdownOpen(){
    this.contentdropdown = !this.contentdropdown;
  }
  activeOptionSelected(i:any){
    this.activeApproveOption = i.src;
    this.altactiveApproveOption = i.alt;
    this.colorVariable = i.id;
    this.contentdropdown = false;
  }
  activeEditOptionSelected(i:any){
    this.editApproval = i.src;
    this.colorVariable = i.id;
    this.contentdropdown = false;
  }

  showtopics(){
    this.showproject=false;
    this.showtopic= !this.showtopic;
  this.showplace= false;
  }
  showprojects(){
    this.showproject=!this.showproject;
    this.showtopic= false;
  this.showplace= false;

  }
  showplaces(){
    this.showproject=false;
    this.showtopic= false;
  this.showplace=!this.showplace;

  }
  projects: any[] = [
    { value: '1', projectname: 'project1' , userassigned:'developer.geomocus@gmail.com', sites:'3' , approval:"../../assets/images/lock.png", checked:false},
    { value: '2', projectname: 'Project Name 2'  , userassigned:'tanuja3494@gmail.com', sites:'5' , approval:"../../assets/images/unlock.png" , checked:false},
    { value: '3', projectname: 'Project Name 3'  , userassigned:'srivas418@gmail.com', sites:'2' , approval:"../../assets/images/lock.png" , checked:false},
    { value: '4', projectname: 'Project Name 4'  , userassigned:'naveen@deepgrid.in', sites:'6' , approval:"../../assets/images/unlock.png" , checked:false}
   
  ];
  


  projectApproval: any[] = [
    {status : "../../assets/images/lock.png"},
    {status : "../../assets/images/lock.png"}
  ]
  toggleDisabled() {
    const car: any = this.projects[1];
    car.disabled = !car.disabled;
}
topics: any[] = [
  { value: '1', topicname: 'Topic Name 1' , checked:false},
  { value: '2', topicname: 'Topic Name 2' , checked:false},
  { value: '3', topicname: 'Topic Name 3' , checked:false}
 
];
places: any[] = [
  {  value: '1', placename: 'Place Name 1' , checked:false },
  {  value: '2', placename: 'Place Name 2' , checked:false },
  { value: '3', placename: 'Place Name 3' , checked:false },
  {  value: '4', placename: 'Place Name 4'  , checked:false}
 
];
  addProject(){
    this.showAddProject = !this.showAddProject;
    this.showEditProject = false;
    }

    editProject(){
  this.showEditProject = !this.showEditProject;
  this.showAddProject = false;
    }
    checkAllProjects(ev) {
      this.projects.forEach(x => x.state = ev.target.checked)
      if(ev.target.checked==true){
      for(let x=0;x<this.projects.length;x++){
        this.projectarray.push(x);
      }
      console.log(ev.target.checked)
      }
      else{
        this.projectarray.splice(0,this.projectarray.length)
      }
    }
  
    isAllProjectsChecked() {
      return this.projects.every(_ => _.state);
      
    }
  
    checkAllTopics(ev) {
      this.topics.forEach(x => x.state = ev.target.checked)
      if(ev.target.checked==true){
        for(let x=0;x<this.topics.length;x++){
          this.topicarray.push(x);
        }
        console.log(ev.target.checked)
        }
        else{
          this.topicarray.splice(0,this.topicarray.length)
        }
    }
  
    isAllTopicsChecked() {
      return this.topics.every(_ => _.state);
    }
  
    checkAllPlaces(ev) {
      this.places.forEach(x => x.state = ev.target.checked)
      if(ev.target.checked==true){
        for(let x=0;x<this.places.length;x++){
          this.placearray.push(x);
        }
        console.log(ev.target.checked)
        }
        else{
          this.placearray.splice(0,this.placearray.length)
        }
    }
  
    isAllPlacesChecked() {
      return this.places.every(_ => _.state);
    }
    Removeprojectpopup(){
      this.Removeprojectconfirm =!this.Removeprojectconfirm;
    }
    Removetopicpopup(){
      this.Removetopicconfirm =!this.Removetopicconfirm;
    }
    Removeplacepopup(){
      this.Removeplaceconfirm =!this.Removeplaceconfirm;
    }
    checkidproject(e){
      this.id = e.target.id;
      this.selectedItems=[];
      const editProjectNameData = this.projects[e.target.id].projectname;
    this.editProjectName.splice(0,this.editProjectName.length);
    this.editProjectName.push(editProjectNameData);
    this.editprojectname = this.editProjectName[0];
    ///////////////////////////////////////////////////////////
    const editUserAssignedData = [
      {"id":e.target.id+1,"itemName":this.projects[e.target.id].userassigned}
    ]
    this.selectedItems.push(editUserAssignedData[0]);
    /////////////////////////////////////////////////////////////
    const editApprovalData = this.projects[e.target.id].approval;
    console.log(editApprovalData,"editapprove")
    this.editApproval = editApprovalData;

    //////////////////////////////////////////////////////////////


      let p=Number(e.target.id)
      
      this.projectarray.push(p);
      this.projectarray.sort((n1,n2) => n1 - n2);
      for(let x=0;x<this.projectarray.length;x++){
        if(this.projectarray[x]==this.projectarray[x+1]){
          this.projectarray.splice(x,2);
        }
       }
      console.log(this.projectarray,"projectarray");
    }




    checkidtopic(e){
      console.log(e,"umeshhhhhhhhhhhhhhh");
      
      let t=Number(e.target.id)
      
      this.topicarray.push(t);
      this.topicarray.sort((n1,n2) => n1 - n2);
      for(let x=0;x<this.topicarray.length;x++){
        if(this.topicarray[x]==this.topicarray[x+1]){
          this.topicarray.splice(x,2);
        }
       }
      console.log(this.topicarray,"topicarray");
    }
    checkidplace(e){
      let pl=Number(e.target.id)
      this.checktest=e.target.checked
      
      this.placearray.push(pl)
      this.placearray.sort((n1,n2) => n1 - n2);
      for(let x=0;x<this.placearray.length;x++){
        if(this.placearray[x]==this.placearray[x+1]){
          this.placearray.splice(x,2);
        }
       }
      console.log(this.placearray,"placearray");
    }
    removeSelectedProject(){
      console.log(this.idarray.length)
      var length = this.projectarray.length
      
      for(let x=length-1;x>=0;x--){
       
          this.projects.splice(this.projectarray[x],1);
          this.projectarray.splice(x,1)
          console.log(this.projectarray,"ppppppppp") 
      }
      this.Removeprojectconfirm=false;
      this.selectedItems=null;
      this.projectName=null;
      this.activeApproveOption =  "../../assets/images/unlock.png";
    }
    removeSelectedTopic(){
      console.log(this.topicarray.length)
      var length = this.topicarray.length
      
      for(let x=length-1;x>=0;x--){
       
          this.topics.splice(this.topicarray[x],1);
          this.idarray.splice(x,1)
          console.log(this.topicarray,"ppppppppp") 
      }
      this.Removetopicconfirm=false;
    }
    removeSelectedPlace(){
      console.log(this.placearray.length)
      var length = this.placearray.length
      
      for(let x=length-1;x>=0;x--){
       
          this.places.splice(this.placearray[x],1);
          this.placearray.splice(x,1)
          console.log(this.placearray,"ppppppppp") 
      }
      this.Removeplaceconfirm=false;
    }
    addtopicname(){
      let inputt = document.getElementById('newtopicname') as HTMLInputElement | null;
  
      let newtopicnames = inputt?.value;
      console.log(newtopicnames) ;
      const newt = {
        "value": this.topics.length, 
        "topicname": `${newtopicnames}`
      }
      if(newtopicnames!=""){
      this.topics.push(newt);
      this.addtopicpopup=false;
      }
      else{
        alert("Enter Topic Name")
      }
      inputt.value=null
      inputt.placeholder=inputt.placeholder;
    }
    addplace(){
      let inputp = document.getElementById('newplacename') as HTMLInputElement | null;
  
      let newplacenames = inputp?.value;
      console.log(newplacenames) ;
      const newp = {
        "value": this.topics.length, 
        "placename": `${newplacenames}`
      }
      if(newplacenames!=""){
      this.places.push(newp);
      this.addplacefield=false;
      }
      else{
        alert("Enter Place Name")
      }
      inputp.value=null;
      inputp.placeholder=inputp.placeholder;
    }
    editplace(){
     if(this.placearray.length==0){
      alert("Select the checkbox to edit");
     }
     else{
      this.d2= document.getElementsByClassName("placename1");
     
     for(let x=0;x<this.placearray.length;x++){
     this.d2[this.placearray[x]].removeAttribute("disabled");
     this.d2[this.placearray[x]].removeAttribute("style");
     console.log(this.d2[0]["value"],"editplace");
     this.showsavebutton=true;
     }
    }
      }
      Saveplace(){
        this.places.forEach(x => x.state = false)
        for(let x=0;x<this.placearray.length;x++){ 
          
        
          this.places[this.placearray[x]].placename=this.d2[this.placearray[x]]["value"];
          console.log(this.places,"updated places");
        this.d3=document.getElementsByClassName("placename1");
        this.d3[this.placearray[x]].setAttribute('disabled', '');
        this.d3[this.placearray[x]].setAttribute("style","background: transparent; border:none;text-align: center;");
        }
        this.showsavebutton=!this.showsavebutton;
        
        this.placearray.splice(0,this.placearray.length);
      }
      
      edittopic(){
        if(this.topicarray.length==0){
         alert("Select the checkbox to edit");
        }
        else{
         this.d4= document.getElementsByClassName("topicname1");
        
        for(let x=0;x<this.topicarray.length;x++){
        this.d4[this.topicarray[x]].removeAttribute("disabled");
        this.d4[this.topicarray[x]].removeAttribute("style");
  
       
        this.showsavetopicbutton=true;
        
        
     
       
        }
       
       }
      }
      
         Savetopic(){
          this.topics.forEach(x => x.state = false)
          console.log(this.d4,"in savetopic");
          this.d7= document.getElementById("topicchecked");
           for(let x=0;x<this.topicarray.length;x++){
           
             this.topics[this.topicarray[x]].topicname=this.d4[this.topicarray[x]]["value"];
             
           this.d5=document.getElementsByClassName("topicname1");
           this.d5[this.topicarray[x]].setAttribute('disabled', '');
           this.d5[this.topicarray[x]].setAttribute("style","background: transparent; border:none;text-align: center;");
           
           
          // this.d4[x].checked=false;
           }
          //  this.checkedItems.forEach(child => {
          //   child.checked = false;
          // });
           this.showsavetopicbutton=!this.showsavetopicbutton;
           console.log(this.d6," I am D6")
           this.topicarray.splice(0,this.topicarray.length);
         }
         searchprojectfilter(pval){
          this.projects=this.PProjects;
          this.Projects=this.PProjects;
          this.Projects=this.projects;
          console.log(pval);
          pval=pval.toLocaleLowerCase();
          this.projects=this.finalfilterproject2(pval);
          

         }
         finalfilterproject2(pval){
          this.Projects=this.projects;
          return this.Projects.filter(x => x.userassigned.toLowerCase().includes(pval));
          
        }
        searchtopicfilter(tval){
          this.topics=this.TTopics;
          this.Topics=this.TTopics;
          this.Topics=this.topics;
          console.log(tval);
          tval=tval.toLocaleLowerCase();
          this.topics=this.finalfiltertopict2(tval);
          

         }
 
  
         finalfiltertopict2(tval){
          this.Topics=this.topics;
          return this.Topics.filter(x => x.topicname.toLowerCase().includes(tval));
          
        }
        searchplacefilter(plval){
          this.places=this.PPlace;
          this.Places=this.PPlace;
          this.Places=this.places;
          console.log(plval);
          plval=plval.toLocaleLowerCase();
          this.places=this.finalfilterplace2(plval);
          

         }
         finalfilterplace2(plval){
          this.Places=this.places;
          return this.Places.filter(x => x.placename.toLowerCase().includes(plval));
          
        }
         }
  
        


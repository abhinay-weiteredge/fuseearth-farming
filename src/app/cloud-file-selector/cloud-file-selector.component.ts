import { Component, OnInit, AfterViewInit, ElementRef, EventEmitter, Output, Input, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { CommonService } from '../Services/common.service';
// import entire SDK

const AWS: any = (window as any).AWS;
// const gapi: any = window['gapi'];
// const google: any = window['google'];
// export const CLIENT_ID = '578048985087-lj3kfku1pcf640o29j74pu8spfaqmckb.apps.googleusercontent.com';
// export const API_KEY = 'AIzaSyDSXrUli8ThLPOTvwVhksDeJAu6Okk6yEk';

// // Array of API discovery doc URLs for APIs used by the quickstart
// export const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

// // Authorization scopes required by the API; multiple scopes can be
// // included, separated by spaces.
// export const SCOPES = 'https://www.googleapis.com/auth/drive.metadata.readonly';



// AWS.config.region = 'ap-southeast-1'; // Region
// AWS.config.credentials = new AWS.CognitoIdentityCredentials({
//     IdentityPoolId: 'ap-southeast-1:cff13619-42b1-48c7-a470-459b66795b3c',
// });

// var albumBucketName = 'test-gallery1';
// var s3 = new AWS.S3({
//   apiVersion: '2006-03-01',
//   params: {Bucket: albumBucketName}
// });

// export function getHtml(template) {
//   return template.join('\n');
// }

// export function viewAlbum(albumName) {
//   const albumPhotosKey = encodeURIComponent(albumName) + '/';
//   s3.listObjects({'Prefix': albumPhotosKey}, function(err, data) {
//     if (err) {
//       return alert('There was an error viewing your album: ' + err.message);
//     }
//     // 'this' references the AWS.Response instance that represents the response
//     const href = AWS.Response.request.httpRequest.endpoint.href;
//     const bucketUrl = href + albumBucketName + '/';

//     const photos = data.Contents.map( (photo) => {
//       const photoKey = photo.Key;
//       const photoUrl = bucketUrl + encodeURIComponent(photoKey);
//       return getHtml([
//         '<span>',
//           '<div>',
//             '<br/>',
//             '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
//           '</div>',
//           '<div>',
//             '<span>',
//               photoKey.replace(albumPhotosKey, ''),
//             '</span>',
//           '</div>',
//         '</span>',
//       ]);
//     });
//     const message = photos.length ?
//       '<p>The following photos are present.</p>' :
//       '<p>There are no photos in this album.</p>';
//     const htmlTemplate = [
//       '<div>',
//         '<button onclick="listAlbums()">',
//           'Back To Albums',
//         '</button>',
//       '</div>',
//       '<h2>',
//         'Album: ' + albumName,
//       '</h2>',
//       message,
//       '<div>',
//         getHtml(photos),
//       '</div>',
//       '<h2>',
//         'End of Album: ' + albumName,
//       '</h2>',
//       '<div>',
//         '<button onclick="listAlbums()">',
//           'Back To Albums',
//         '</button>',
//       '</div>',
//     ];
//     document.getElementById('viewer').innerHTML = getHtml(htmlTemplate);
//     document.getElementsByTagName('img')[0].setAttribute('style', 'display:none;');
//   });
// }

@Component({
  selector: 'app-cloud-file-selector',
  templateUrl: './cloud-file-selector.component.html',
  styleUrls: ['./cloud-file-selector.component.scss']
})
export class CloudFileSelectorComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() reset: string;
  @Output() fileSelected: EventEmitter<any> = new EventEmitter<any>();
  @Output() closeCfm: EventEmitter<any> = new EventEmitter<any>();

  fileSelectorView = 'AWS'; // 'GOOGLE';
  checkCount = 0;
  googlePickerApiLoaded: boolean;
  googleOauthToken: string;
  googleAuthAPILoaded: boolean;

  googleDeveloperKey = 'AIzaSyDSXrUli8ThLPOTvwVhksDeJAu6Okk6yEk';
// The Client ID obtained from the Google Developers Console. Replace with your own Client ID.
  googleClientId = '578048985087-lj3kfku1pcf640o29j74pu8spfaqmckb.apps.googleusercontent.com';
  googleScope = ['https://www.googleapis.com/auth/drive.file'];

  albumBucketName = 'test-gallery1';
  amazonS3BucketName = 'test-gallery1';
  // test_pool1
  // IAM role name:  Cognito_test_pool1Auth_Role
  // Cognito_test_pool1Unauth_Role
  // policy = 'test_policy1';

s3: any;

baseUrl = 'https://' + this.albumBucketName + '.s3.ap-southeast-1.amazonaws.com';
  currentFilesList: any[] = [];
  fileListingStatus = 'unknown';
  dirStruct: string[] = ['/'];
  currentFolder: string;
  // selectedFile = '';
  // selectedFileName = '';
  selectedFilesList: any[] = [];

  constructor(private commonService: CommonService) {
    // AWS.config.region = 'us-west-1'; // Region
    // AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    //   IdentityPoolId: 'us-west-1:9ca45246-d3c9-4175-87dc-5465c6ef1cc1',
    // });

    // REFERENCE EXAMPLE
    // https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/s3-example-photos-view.html
    AWS.config.region = 'ap-southeast-1'; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'ap-southeast-1:cff13619-42b1-48c7-a470-459b66795b3c',
    });


    this.s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {Bucket: this.albumBucketName}
    });
  }

  ngOnInit(): void{
    this.listFilesAndFolders();
  }
  ngOnChanges(changes: {[key: string]: SimpleChange}): void{
    console.log('In CFM Changes');
    console.log(changes);
    if (changes.reset){
      this.resetAll();
    }
  }
  resetAll(): void{
    // this.selectedFile = '';
    // this.selectedFileName = '';
    this.selectedFilesList = [];
    this.clearAllSelectedFiles();
  }
  doUnSelect(e): void{
    console.log(e);
    const clsList: DOMTokenList = e.target.classList;
    console.log(clsList);
    if (clsList.contains('files-and-folders-container') || clsList.contains('navigation-links-container') ||
      clsList.contains('navigation-link')) {
      this.resetAll();
    }
  }

  getFileSize(sizeInNum: number): string{
    let sizeExt = 'Bytes';
    let num: string = String(sizeInNum); // In Bytes

    // KBs
    // Number is greater than 1 KB
    if (Number(num) >= 1024) {
      sizeExt = 'KB';
      num = (Number(num) / 1024).toFixed(2);

      // MBs
      // Number is greater than 1 MB
      if (Number(num) >= 1024) {
        sizeExt = 'MB';
        num = (Number(num) / 1024).toFixed(2);

        // GBs
        // Number is greater than 1 GB
        if (Number(num) >= 1024) {
          sizeExt = 'GB';
          num = (Number(num) / 1024).toFixed(2);
        }
      }

    }

    return `${num} ${sizeExt}`;
  }
  ngAfterViewInit(): void{
    // setTimeout(() => {
    //   this.handleClientLoad();
    // }, 5000);
    console.log(this);
    // this.loadGapiClient();
    // this.listAlbums();
    // this.listFilesAndFolders();
  }
  listFilesAndFolders(delimiter = '/', prefix = ''): void{
    console.log('In listAlbums');
    console.log(this);
    // this.s3.listObjectsV2({'Delimiter': '/', 'Prefix': 'file1/layers/'}, (err, data) => {
    this.fileListingStatus = 'loading';
    this.currentFilesList = [];
    this.s3.listObjectsV2({Delimiter: delimiter, Prefix: prefix}, (err, data) => {
      console.log(err);
      console.log(data);
      const tempCurrentFiles = [];
      if (err) {
        this.currentFilesList = [];
        this.fileListingStatus = 'loaded';
        return alert('There was an error listing your albums: ' + err.message);
      } else {
          const commonPrefixes: any [] = data.CommonPrefixes;
          commonPrefixes.forEach(element => {
            tempCurrentFiles.push({
              Type: 'Folder',
              name: element.Prefix.substring(element.Prefix.indexOf(data.Prefix) + data.Prefix.length) // element.Prefix
            });
          });
          const contents: any [] = data.Contents;
          let index = 0;
          contents.forEach(element => {
            // let isValidFile = false;
            const fileName = element.Key.substring(element.Key.indexOf(data.Prefix) + data.Prefix.length);
            if (element.Key.includes('.') /*&& element.Key.includes('.zip')*/){
              element.Type = 'File';
              element.name =  fileName; // element.Key;
              element.shortFileSize = this.getFileSize(element.Size);
              element.extension = fileName.substring(fileName.lastIndexOf('.'));
              element.selected = false;
              element.url = '';
              element.size = element.Size,
              element.id = `${String(new Date().getTime())}_${index++}`;
              tempCurrentFiles.push(element);
            }
          });
          console.log(tempCurrentFiles);
          this.currentFolder = delimiter + prefix;
          this.currentFilesList = tempCurrentFiles;
          this.fileListingStatus = 'loaded';
      }
    });
  }

  navLinkClicked(dir, i): void{
    let currFolder = '';
    // this.selectedFile = '';
    // this.selectedFileName = '';
    this.selectedFilesList = [];
    for (let index = 0; index <= i ; index++) {
      currFolder += this.dirStruct[index];
    }
    console.log('CURR FOLDER: ', currFolder);
    if (this.currentFolder === currFolder) {
      console.log('WE ARE IN SAME FOLDER');
    } else{
      console.log('LOOKING FOR ANOTHER FOLDER');
      // if(currFolder == '/')
      const num = this.dirStruct.length;
      console.log(num, ' : ' , i);
      for ( let index = num - 1 ; index > i ; index --){
        console.log(index, ' : ', num);
        this.dirStruct.pop();
      }
      //   currFolder = '';
      // let prefix = currFolder + currFile.name;
      this.listFilesAndFolders('/', currFolder.substring(currFolder.indexOf('/') + 1));
      // this.listFilesAndFolders('/', currFolder);
    }
  }

  fileClicked(currFile): void{
    console.log('in fileClicked');
    console.log(currFile);
    console.log(this);
    let currFolder = '';
    // this.selectedFile = '';
    // this.selectedFileName = '';
    this.dirStruct.forEach(dirName => {
      currFolder += dirName;
    });
    if (currFile.Type === 'Folder') {
      console.log('Delimiter : /');
      this.clearAllSelectedFiles();
      console.log('Prefix : ', currFolder + currFile.name);
      const prefix = currFolder + currFile.name;
      this.listFilesAndFolders('/', prefix.substring(prefix.indexOf('/') + 1));
      this.dirStruct.push(currFile.name);
    } else {
      const url = this.baseUrl + currFolder + currFile.name;
      console.log('JUST SELECTED THE FILE. URL IS : ', url);
      // this.selectedFile = url;
      // this.selectedFileName = currFile.name;

      const fileIndex = this.selectedFilesList.findIndex(file => file.id === currFile.id);
      if (fileIndex === -1) {
        // FILE NOT SELECTED YET. SO, ADD TO SELECTED FILES
        currFile.url = url;
        currFile.selected = true;
        this.selectedFilesList.push(currFile);
      } else {
        // FILE ALREADY SELECTED. SO, REMOVE SELECTION
        currFile.url = '';
        currFile.selected = false;
        this.selectedFilesList.splice(fileIndex, 1);
      }
      console.log(this.currentFilesList);
      console.log(this.selectedFilesList);
    }
  }
  fileSelectionFun(): void{
    // this.fileSelected.emit(this.selectedFile);
    const isFileMoreThan100 = this.checkFileSize(this.selectedFilesList, 100);
    const isFileMoreThan50 = this.checkFileSize(this.selectedFilesList, 50);

    if (isFileMoreThan100){
      window.alert('One of the select file size is more than 100 MB. Please choose other files');
    } else if (isFileMoreThan50) {
      const res = window.confirm('One of the file size is more than 50 MB. This will take more time to load. Do you want to continue..?');
      if (res) {
        this.fileSelected.emit(this.selectedFilesList);
      }
    } else {
      this.fileSelected.emit(this.selectedFilesList);
    }
  }
  closeAwsFilePicker(): void{
    this.closeCfm.emit('close');
  }

  private checkFileSize(inputFiles, maxSize = 100): boolean{
    let isLargFile = false;
    Array.from(inputFiles).forEach((file: any) => {
      const convertedSize = (file.size / (1024 * 1024)).toFixed(1);
      if (Number(convertedSize) > maxSize) {
        isLargFile = true;
      }
    });
    return isLargFile;
  }

  clearAllSelectedFiles(): void{
    this.currentFilesList.forEach(file => {
      file.selected = false;
    });
    this.selectedFilesList = [];
  }




  // GOOGLE DRIVE
  loadGapiClient(): void{
    this.checkCount++;
    console.log('In loadGapiClient', this.checkCount, (window as any).gapi);
    if ( this.commonService.isValid((window as any).gapi)) {
      // this.handleClientLoad();
      this.onGoogleApiLoad();
    } else if (this.checkCount <= 10 ) {
      setTimeout(() => {
        this.loadGapiClient();
      }, 2000);
    }
  }

  onGoogleApiLoad(): void{
    console.log('in onGoogleApiLoad');
    (window as any).gapi.load('auth2', {callback: this.onGoogleAuthApiLoad.bind(this)});
    (window as any).gapi.load('picker', {callback: this.onGooglePickerApiLoad.bind(this)});
  }

  onGoogleAuthApiLoad(): void{
    console.log('in onGoogleAuthApiLoad');
    console.log((window as any).gapi.auth2.getAuthInstance());
    this.googleAuthAPILoaded = true;
    console.log(this);
  }

  onGooglePickerApiLoad(): void{
    console.log('in onGooglePickerApiLoad');
    this.googlePickerApiLoaded = true;
    console.log(this);
      // this.createPicker();
  }

  doGoogleDriveLogin(e): void{
    console.log('doGoogleDriveLogin');
    console.log(e);
    let token = '';
    const tokenStrtTime = localStorage.getItem('gapiTokenStartTime');
    if ((new Date().getTime() - Number(tokenStrtTime)) >= 3500000) {
      console.log('GAPI TOKEN EXPIRED');
      token = '';
      localStorage.setItem('gapiToken', '');
    } else{
      token = localStorage.getItem('gapiToken');
    }
    this.googleOauthToken = token;
    if (token !== null && token !== undefined && token !== '') {
      this.googleOauthToken = localStorage.getItem('gapiToken');
      this.createGooglePicker();
    } else {
      (window as any).gapi.auth2.authorize(
                {
                    client_id: this.googleClientId,
                    scope: this.googleScope,
                    immediate: false
                },
        this.handleGoogleAuthResult.bind(this));
    }
  }

  handleGoogleAuthResult(authResult): void{
    console.log('in handleGoogleAuthResult');
    console.log(authResult);
    if (authResult && !authResult.error) {
      this.googleOauthToken = authResult.access_token;
      this.createGooglePicker();
      localStorage.setItem('gapiToken', authResult.access_token);
      localStorage.setItem('gapiTokenStartTime', String(new Date().getTime()));
    }
  }

  // Create and render a Picker object for picking user Photos.
  createGooglePicker(): void{
    console.log('in createGooglePicker');
    if (this.googlePickerApiLoaded && this.googleOauthToken) {
        console.log('picker api loaded : ', this.googlePickerApiLoaded);
        console.log('token : ', this.googleOauthToken);
        const picker = new (window as any).gapi.picker.api.PickerBuilder().
                  addViewGroup(
                          new (window as any).gapi.picker.api.ViewGroup((window as any).gapi.picker.api.ViewId.DOCS) /*.
                          addView(window['gapi'].picker.api.ViewId.DOCUMENTS).
                          addView(window['gapi'].picker.api.ViewId.PRESENTATIONS)*/).
                  setOAuthToken(this.googleOauthToken).
                  setDeveloperKey(this.googleDeveloperKey).
                  setCallback(this.googlePickerCallback.bind(this)).
                  build();
        picker.setVisible(true);
      }
  }

  // A simple callback implementation.
  googlePickerCallback(data): void{
    console.log('in googlePickerCallback');
    let url = 'nothing';
    let name = 'nothing';
    console.log(data);
    if (data[(window as any).gapi.picker.api.Response.ACTION] === (window as any).gapi.picker.api.Action.PICKED) {
          const doc = data[(window as any).gapi.picker.api.Response.DOCUMENTS][0];
          url = doc[(window as any).gapi.picker.api.Document.URL];
          name = doc.name;
          if (url.includes('?')){
            url = url + '&name=' + name;
          } else{
            url = url + '?name=' + name;
          }
          console.log(url);
          console.log(name);

      }

  }

  listFilesAndFoldersForPrototype(delimiter = '/', prefix = ''): any{
    console.log('In listAlbums');
    console.log(this);
    // this.s3.listObjectsV2({'Delimiter': '/', 'Prefix': 'file1/layers/'}, (err, data) => {
    this.fileListingStatus = 'loading';
    this.currentFilesList = [];
    let returnVal;
    const listObjectsAsObservable = Observable.bindNodeCallback(this.s3.listObjects.bind(this.s3));
    listObjectsAsObservable({'Delimiter': '/', 'Prefix': prefix})
    .subscribe({
      next: (response) => { returnVal = response; console.log(response) },
      error: (err) => console.log(err)
    });
    setTimeout(() => {
      console.log(returnVal);
      return returnVal
    }, 2000);
  }

}

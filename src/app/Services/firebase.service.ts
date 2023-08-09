import { Injectable } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase';
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private firestorage: AngularFireStorage) { }

  uploadFileAndGetURL(inputFile, fileType, fileId, siteId, uploadFor, fileStatus: Subject<any>): any {
    console.log('In uploadFileAndGetURL');
    console.log(inputFile, fileType);
    const utcTime = moment().utc().valueOf();
    // this.removeGarbageData();
    const filePath = `${uploadFor}_${fileType}/${utcTime}_${inputFile.name}`;
    const fileRef = this.firestorage.ref(filePath);
    const task = this.firestorage.upload(filePath, inputFile);
    task.catch(err => {
      console.log(err);
    });
    task.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().forEach((downloadURL) => {
          // this.firebaseUtilCallback(downloadURL);
          // DO CALL BACK
          fileStatus.next({
            fileName: inputFile.name,
            progress: 100,
            status: 'completed',
            url: downloadURL,
            id: fileId,
            siteId
          });
        });
      })
    ).subscribe();
    task.percentageChanges().subscribe(res => {
      console.log('TOTAL CHANGES');
      console.log(res);
    });
    task.task.on(firebase.default.storage.TaskEvent.STATE_CHANGED,
      (snapshot) => {
        // in progress
        console.log('IN PROGRESS : ', snapshot);
        const snap = snapshot as firebase.default.storage.UploadTaskSnapshot;
        const prog = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        // progress.next(prog);
        fileStatus.next({
          fileName: inputFile.name,
          progress: prog,
          status: 'inprogress',
          url: '',
          id: fileId,
          siteId
        });
        console.log(prog);
        return prog;
      },
      (error) => {
        // fail
        console.log('Upload ERROR');
        console.log(error);
        fileStatus.next({
          fileName: inputFile.name,
          progress: 0,
          status: 'error',
          url: '',
          id: fileId,
          siteId
        });
        return error;
      }).bind(this);
  }

  // #TODO - we need to remove one week pold firebase data
  private removeGarbageData(): void{
    // Here Deleting the image storage data week back
    const weekbackTimestamp = moment().utc().add(-7, 'days');
    /* this.firestorage.ref('.jpg/').getDownloadURL().forEach((metadata) => {
      console.log('metadata ', metadata);
    }); */
    /* this.firestorage.ref('.jpg/').getMetadata((metadata) => {
    console.log('metadata ', metadata)
    }); */
  }
}

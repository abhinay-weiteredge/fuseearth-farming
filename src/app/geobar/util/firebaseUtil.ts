import { AngularFireStorage } from '@angular/fire/storage';
import * as firebase from 'firebase';
import { finalize } from 'rxjs/operators';
import * as moment from 'moment';
import { Subject } from 'rxjs';

export class FirebaseUtil {
  public firebaseUtilCallback: (firebaseFileURL) => any;

  constructor(private firestorage: AngularFireStorage) { }

  getFirebaseFileURL(inputFile, fileType, metaData, progress: Subject<any>): void{
    const utcTime = moment().utc().valueOf();
    this._removeGarbageData();
    const filePath = `${fileType}/${utcTime}_${inputFile.name}`;
    const fileRef = this.firestorage.ref(filePath);
    const task = this.firestorage.upload(filePath, inputFile);
    task.snapshotChanges().pipe(
      finalize(() => {
        fileRef.getDownloadURL().forEach((downloadURL) => {
          this.firebaseUtilCallback(downloadURL);
        });
      })
    ).subscribe();
    task.task.on(firebase.default.storage.TaskEvent.STATE_CHANGED,
      (snapshot) => {
        // in progress
        console.log('IN PROGRESS : ', snapshot);
        const snap = snapshot as firebase.default.storage.UploadTaskSnapshot;
        const prog = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        progress.next(prog);
        console.log(prog);
        return prog;
      },
      (error) => {
        // fail
        console.log('Upload ERROR');
        console.log(error);
        return error;
      });
  }

  // #TODO - we need to remove one week pold firebase data
  private _removeGarbageData(): void{
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

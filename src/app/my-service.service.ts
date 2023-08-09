import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MyService {
  // Declare a new Subject
  private triggerKeyupEnter = new Subject<void>();

  // Provide a public property to access the Subject
  public triggerKeyupEnter$ = this.triggerKeyupEnter.asObservable();

  // Provide a method to trigger the Subject
  public trigger() {
    this.triggerKeyupEnter.next();
  }

  fileNames: string[] = [];

  addFileName(fileName: string) {
    this.fileNames.push(fileName);
  }

}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlopeAEDSService {
  private fileDataCache$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

  constructor(private http: HttpClient) { }

  getTextFileData(url: string): Observable<string> {
    const cachedData = this.fileDataCache$.getValue();
    if (cachedData) {
      return this.fileDataCache$;
    } else {
      return this.http.get(url, { responseType: 'text' });
    }
  }

  getFileDataCache(): Observable<string> {
    return this.fileDataCache$.asObservable(); // Returning as an Observable
  }

  cacheFileData(data: string) {
    this.fileDataCache$.next(data);
  }
}

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class SlopeAEDSService {
//   private fileDataCache$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

//   constructor(private http: HttpClient) { }

//   getTextFileDataFromAPI(apiEndpoint: string): Observable<string> {
//     const cachedData = this.fileDataCache$.getValue();
//     if (cachedData) {
//       return this.fileDataCache$;
//     } else {
//       return this.http.get(apiEndpoint, { responseType: 'text' });
//     }
//   }

//   getFileDataCache(): Observable<string> {
//     return this.fileDataCache$.asObservable();
//   }

//   cacheFileData(data: string) {
//     this.fileDataCache$.next(data);
//   }
// }

// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class SlopeAEDSService {
//   private fileDataCache$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

//   constructor(private http: HttpClient) { }

//   getFileDataFromAPI(apiEndpoint: string): Observable<string> {
//     const cachedData = this.fileDataCache$.getValue();
//     if (cachedData) {
//       return this.fileDataCache$;
//     } else {
//       return this.http.get(apiEndpoint, { responseType: 'text' });
//     }
//   }

//   getFileDataCache(): Observable<string> {
//     return this.fileDataCache$.asObservable();
//   }

//   cacheFileData(data: string) {
//     this.fileDataCache$.next(data);
//   }
// }

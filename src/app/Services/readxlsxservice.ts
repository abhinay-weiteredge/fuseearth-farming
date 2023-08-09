import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {

  constructor(private http: HttpClient) { }

  getExcelData() {
    const excelUrl = 'https://firebasestorage.googleapis.com/v0/b/geomocus-qa.appspot.com/o/static_data%2FTIFF_TEXT.xlsx?alt=media&token=e40324d4-9f75-4d95-8705-24b213576558';
    return this.http.get(excelUrl, { responseType: 'blob' }).toPromise().then((data: any) => {
      // Store the file in the cache
      const blob = new Blob([data], { type: 'application/vnd.ms-excel' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.download = 'TIFF_TEXT.xlsx';
      anchor.href = url;
      anchor.click();
    });
  }
}

import { Injectable } from '@angular/core';
import { FormControl } from '@angular/forms';
import OlMap from 'ol/Map';
import {Vector as VectorLayer} from 'ol/layer';

export enum ElementType{
  INPUT = 'INPUT',
  SELECT = 'SELECT'
}

@Injectable({
  providedIn: 'root'
})

export class CommonService {
  eligibleFarmingObject: any;
  constructor() { }

  isAuthenticated(): boolean{
    if (this.isValid(localStorage.getItem('token'))) {
      return true;
    } else {
      return false;
    }
  }
  isValid(str): boolean{
    str = String(str);
    if (str == null || str === undefined || str === '' || str === 'null' || str === 'undefined' || str === ' ') {
      return false;
    } else {
      return true;
    }
  }

  parseDateForSafariSupport(date): string{
    try{
      if (this.isValid(date)){
        if (date.lastIndexOf('+') === -1) {
          return date;
        } else {
          return date.substring(0, date.lastIndexOf('+')) + 'Z';
        }
      } else{
        return date;
      }
    } catch (e){return date; }
  }

  isValidURL(str): boolean{
    const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
    return !!pattern.test(str);
  }

  getFullNameFromFirstAndLastName(fName, lName): string{
    if (!this.isValid(lName)){
      return fName;
    } else {
      return fName + ' ' + lName;
    }
  }
  slopefinderPreview(farmingObj){
    console.log(farmingObj, 'eleig farming')
    this.eligibleFarmingObject = farmingObj
  }
  sloperFinderAEDSpreview(){
    console.log(this.eligibleFarmingObject, 'eligiblefarming')
    return this.eligibleFarmingObject;
  }

  getFormErrorMsg(ctrl: FormControl, name: string, type: ElementType): string{
    if (!ctrl.valid){
      if (ctrl.getError('required')){
        return `Please ${type === ElementType.INPUT ? `enter` : `select`} ${name}`;
      } else if (ctrl.getError('email')){
        return `Please ${type === ElementType.INPUT ? `enter` : `select`} valid ${name}`;
      } else if (ctrl.getError('minlength')){
        return `${name} should be atleast ${ctrl.getError('minlength').requiredLength} characters`;
      } else if (!this.isValid(ctrl.errors)){
        return '';
      } else {
        return 'Error...';
      }
    } else{
      return '';
    }
  }

  getCountryList(): Array<string>{
    return [ 'United States',
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic (Czechia)', 'Côte d\'Ivoire',
    'DR Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Holy See', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts & Nevis', 'Saint Lucia', 'Samoa', 'San Marino', 'Sao Tome & Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'St. Vincent & Grenadines', 'State of Palestine', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe'];
  }

  
  sortByAsc(data: any[]): any[]{
    data.sort((a, b) => {
      const customFieldA = new Date(a.updatedDate).getTime();
      const customFieldB = new Date(b.updatedDate).getTime();
      return (customFieldA < customFieldB) ? -1 : (customFieldA > customFieldB) ? 1 : 0;
    });
    return data;
  }
  sortByDesc(data: any[]): any[]{
    data.sort((a, b) => {
      const customFieldA = new Date(a.updatedDate).getTime();
      const customFieldB = new Date(b.updatedDate).getTime();
      return (customFieldA > customFieldB) ? -1 : (customFieldA < customFieldB) ? 1 : 0;
    });
    return data;
  }

  getLayerOfMap(mapObj: OlMap, name: string): VectorLayer{
    let layerToReturn: VectorLayer = null;
    if (this.isValid(name)){
      mapObj.getLayers().forEach(layerObj => {
        if (this.isValid(layerObj)) {
          if (layerObj.values_.name === name) {
            layerToReturn = layerObj;
          }
        }
      });
    }
    return layerToReturn;
  }

  getObjectClone(copyFrom: any = {}): any{
    const copiedData: any = {};
    for (const key in copyFrom) {
      if (copyFrom.hasOwnProperty(key)) {
        copiedData[key] = copyFrom[key];
      }
    }
    return copiedData;
  }

}

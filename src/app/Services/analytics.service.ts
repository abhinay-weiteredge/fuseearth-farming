import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

declare const gtag: any;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor() { }

  // TO VIEW EVENTS DOCUMENTATION
  // https://developers.google.com/analytics/devguides/collection/gtagjs/events
  sendLoginData(name, email, title, provider): void{
    if (environment.sendGoogleAnalytics){
      gtag('event', 'login', {
        user_name: name,
        email,
        method: provider === 'password' ? 'Email' :
                ( provider === 'google' ? 'Google' :
                (provider === 'facebook' ? 'Facebook' : 'Unknown')), // 'Google',
        // page_location: 'login', // URL
        page_title: title
      });
    }
  }

  sendPageViewData(path, title): void{
    if (environment.sendGoogleAnalytics){
      gtag('event', 'page_view', {
        page_path: path,
        // page_location: 'geopad', // URL
        page_title: title,
        user_name: localStorage.getItem('name'), // 'temp',
        email: localStorage.getItem('email')
      });
    }
  }

  // gtag("event", "search", {
  //   search_term: "t-shirts"
  // });

  // gtag("event", "share", {
  //   method: "Twitter",
  //   content_type: "image",
  //   item_id: "C_12345",
  // });

  // gtag("event", "sign_up", {
  //   method: "Google"
  // });


}

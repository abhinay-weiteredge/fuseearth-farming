import {Injectable, PLATFORM_ID, Inject, APP_ID} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
// declare let document:any;
@Injectable({
  providedIn: 'root'
})
export class CustomSpinner{
    private selector = 'preloader';
    private element: HTMLElement;

    constructor() {
      console.log('IN CUSTOM SPIN CONS');
      this.element = document.getElementById(this.selector);
    }

    public show(): void {
      this.element.style.display = 'block';
    }

    public hide(delay: number = 0): void {
      setTimeout(() => {
        this.element.style.display = 'none';
      }, delay);
    }
}

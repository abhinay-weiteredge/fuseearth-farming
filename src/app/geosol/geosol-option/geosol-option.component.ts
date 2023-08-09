import { Component, OnInit, Input, ViewChild, ElementRef, Renderer2, RendererFactory2 } from '@angular/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-geosol-option',
  templateUrl: './geosol-option.component.html',
  styleUrls: ['./geosol-option.component.scss']
})
export class GeosolOptionComponent implements OnInit {

  @Input() width = 100;
  @Input() isActive = false;
  @Input() backgroundStyle: any = {};
  @Input() cssClass = '';
  @ViewChild('mainDiv') mainDiv: ElementRef<HTMLDivElement>;

  private renderer: Renderer2;
  constructor(private _renderer: RendererFactory2) {
    this.renderer = this._renderer.createRenderer(null, null);
  }

  ngOnInit() {
    // console.log(this);
    // $('#abcd123').click(function (e) {
    //   console.log('IN click');
    //   console.log(e);
    //   // Remove any old one
    //   $('.ripple').remove();

    //   // Setup
    //   var posX = $(this).offset().left,
    //       posY = $(this).offset().top,
    //       buttonWidth = $(this).width(),
    //       buttonHeight =  $(this).height();

    //   // Add the element
    //   $(this).prepend('<span class='ripple'></span>');


    //  // Make it round!
    //   if(buttonWidth >= buttonHeight) {
    //     buttonHeight = buttonWidth;
    //   } else {
    //     buttonWidth = buttonHeight;
    //   }

    //   // Get the center of the element
    //   var x = e.pageX - posX - buttonWidth / 2;
    //   var y = e.pageY - posY - buttonHeight / 2;


    //   // Add the ripples CSS and start the animation
    //   $('.ripple').css({
    //     width: buttonWidth,
    //     height: buttonHeight,
    //     top: y + 'px',
    //     left: x + 'px'
    //   }).addClass('rippleEffect');
    // });
  }

  setRipple(event) {
    console.log('IN setRipple');
    console.log(event);
    // Remove any old one
    // this.renderer.removeClass(this.mainDiv.nativeElement,'ripple');
    console.log(this.mainDiv.nativeElement.getElementsByClassName('custom-ripple'));
    if (this.mainDiv.nativeElement.getElementsByClassName('custom-ripple').length > 0) {
      console.log('SPAN FOUND');
      this.mainDiv.nativeElement.removeChild(this.mainDiv.nativeElement.getElementsByClassName('custom-ripple')[0]);
    } else {
      console.log('NO SPAN FOUND');
    }
    // $('.ripple').remove();

    // Setup

    const posX = /*$(this).offset().left*/ /*this.mainDiv.nativeElement.offsetLeft,*/ event.offsetX,
      posY = /*$(this).offset().top*/ /*this.mainDiv.nativeElement.offsetTop ,*/ event.offsetY;
    let buttonWidth = /*$(this).width()*/ /*this.mainDiv.nativeElement.clientWidth ,*/ this.width,
      buttonHeight =  /*$(this).height();*/ /*this.mainDiv.nativeElement.clientHeight */ this.width;

    // Add the element
    // $(this).prepend('<span class='ripple'></span>');
    const spanElement = this.renderer.createElement('span');
    this.renderer.addClass(spanElement, 'custom-ripple');
    // this.renderer.setProperty(spanElement,'class','ripple');
    // this.renderer.appendChild(this.mainDiv.nativeElement, spanElement);

    // Make it round!
    if (buttonWidth >= buttonHeight) {
      buttonHeight = buttonWidth;
    } else {
      buttonWidth = buttonHeight;
    }

    // Get the center of the element
    const x = event.pageX - posX - buttonWidth / 2;
    const y = event.pageY - posY - buttonHeight / 2;
    console.log(event.pageX, event.pageY);
    console.log(posX, posY);
    console.log(x, y);

    this.renderer.setStyle(spanElement, 'width', buttonWidth);
    this.renderer.setStyle(spanElement, 'height', buttonHeight);
    this.renderer.setStyle(spanElement, 'top', y + 'px');
    this.renderer.setStyle(spanElement, 'left', x + 'px');
    this.renderer.addClass(spanElement, 'custom-rippleEffect');
    this.renderer.appendChild(this.mainDiv.nativeElement, spanElement);
    // Add the ripples CSS and start the animation
    // $('.ripple').css({
    //   width: buttonWidth,
    //   height: buttonHeight,
    //   top: y + 'px',
    //   left: x + 'px'
    // }).addClass('rippleEffect');

  }

}

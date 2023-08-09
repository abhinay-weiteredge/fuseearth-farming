# ng2-fan-menu used for geotray

### Vendor Git Reference
https://github.com/DanielYKPan/ng2-fan-menu

### How to use
- Make sure to remove ng2-fan-menu dependency from package.json

- create /vendor/ng2-fan-menu under /app

- Download code from the above mentioned git repo,  extract contents from /src folder and create in our app /vendor/ng2-fan-menu

- Add below lines in `app.module.ts`

  ```
     import { FanMenuModule } from './vendor/ng2-fan-menu/menu.module'
  ```

  Add `FanMenuModule` under `@NgDirective`
  ```
   imports: [
    ...
    BrowserModule,
    NgbModule,
    HttpClientModule,
    TestFanMenuModule,
    FanMenuModule,
    FormsModule,
    ...
   ]
  ```
  Make sure to include FanMenuModule module at your project root module(In most of the case, FanMenuModule should be included in AppModule).

### Why we added source instead of npm package?

We need custom events like `ctrl+click` on menu wing.

### Custom additions to the source

- Modify `wing-svg` element `tap` event as below in `menu-wing.component.html`
  `...
   (tap)="onClick($event)"
   ...
  `
- Modify `interface IMenuWing` with additional property as below.
  ```
  export interface IMenuWing {
    ...
    srcEvent: any
    ...
  }
  ```
- Modify `public onClick` even in `menu-wing.component.ts` with below line
  ```
  public onClick($event): void { // newly added parameter $event
      this.wing.srcEvent = $event; // newly added line
      this.wingClicked.emit(this.wing);
  }
  ```
- Modify `<i> element in menu-wing.component.html` as below
  Replace this code with
  ```
  <i class="{{wing.icon.name}}"
    #wingIconElm
    *ngIf="menuConfig.showIcons || menuConfig.onlyIcons"
    [ngStyle]="{
        'color': wing.icon.color || menuConfig.wingFontColor,
        'font-size': iconSize + 'px',
        'width': iconSize + 'px',
        'height': iconSize + 'px'
    }"></i>
  ```
  this code. Here we changed `<i>` to `<img>` and provide `src`
  ```<img class="{{wing.icon.name}}" src="{{wing.icon.name}}"
       #wingIconElm
       *ngIf="menuConfig.showIcons || menuConfig.onlyIcons"
       [ngStyle]="{
            'color': wing.icon.color || menuConfig.wingFontColor,
            'font-size': iconSize + 'px',
            'width': iconSize + 'px',
            'height': iconSize + 'px'
       }"/>
  ```
- Add new Event `wingHoveredOut` similar to `wingHovered` in   `menu-wing.component.ts`
  Emit the above event in `onMouseOut` event
  Propoate the event `menu-container.component.ts`
  Listen to event `wingHoveredOut` and reemit as `hoverOutWing` 

  ```
  public hoverOutWing( wing: IMenuWing ): void {
      if (!this.isDragging && !this.isSpinning) {
          this.onWingHoveredOut.emit(wing);
      }
    }
  ```
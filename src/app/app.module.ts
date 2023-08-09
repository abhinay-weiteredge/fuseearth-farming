import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbDropdown, NgbDropdownModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
// import { Ng4LoadingSpinnerModule } from 'ng4-loading-spinner';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ConfigServices } from './config.service';
import { Logger, Options as LoggerOptions, Level as LoggerLevel } from 'angular2-logger/core';
import { MapCanvasComponent } from './map-canvas/map-canvas.component';
import { PerfectScrollbarModule, PerfectScrollbarConfigInterface, PERFECT_SCROLLBAR_CONFIG, Geometry } from 'ngx-perfect-scrollbar';
import { NgProgressModule, /*NgProgressInterceptor*/  } from 'ngx-progressbar';
import { NgxFileDropModule } from 'ngx-file-drop';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { FanMenuModule } from './vendor/ng2-fan-menu/menu.module';
import { BasemapComponent } from './basemap/basemap.component';
import { GeotrayComponent } from './geotray/geotray.component';
import { GeosolComponent } from './geosol/geosol.component';
import { GeoPopupComponent } from './geopopup/geopopup.component';
import { GeobarComponent } from './geobar/geobar.component';
import { GeobarService } from './geobar/geobar.service';
import { GeobarAlertComponent } from './geobar-alert/geobar-alert.component';
import { GeotowerComponent } from './geotower/geotower.component';
import { TowerItemComponent } from './geotower/tower-item/tower-item.component';
import { TowerGroupItemComponent } from './geotower/tower-group-item/tower-group-item.component';
import { TowerScrollerComponent } from './geotower/tower-scroller/tower-scroller.component';
import { TowerItemOptionsComponent } from './geotower/tower-item-options/tower-item-options.component';
import { GeotowerService } from './geotower/geotower.service';
import { AngularFireModule } from '@angular/fire';
import { environment } from '../environments/environment';
import { AngularFireStorageModule } from '@angular/fire/storage';
import { ConnectionComponent } from './geotower/tower-item-headers/connection/connection.component';
import { SpecificationComponent } from './geotower/tower-item-headers/specification/specification.component';
import { FunctionComponent } from './geotower/tower-item-headers/function/function.component';
import { DepictionComponent } from './geotower/tower-item-headers/depiction/depiction.component';
import { InteractionComponent } from './geotower/tower-item-headers/interaction/interaction.component';
import { AngularDraggableModule } from 'angular2-draggable';
import { UserLoginComponent } from './user-login/user-login.component';
import { AuthObservableService } from './Services/authObservableService';
import { SocialAuthService } from './Services/socialAuthService';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SocialShareDirective } from './social-share/social-share.component';
// import { GeoNotepadComponent } from './geo-notepad/geo-notepad.component';
import { NgSlimScrollModule, SLIMSCROLL_DEFAULTS } from 'ngx-slimscroll';
import { GeoNotePadService } from './Services/geo-notepad.service';
import { ReactiveFormsModule } from '@angular/forms';
import { DbfTableComponent } from './geotower/tower-item-headers/dbf-table/dbftable.component';
import { GeosolOptionComponent } from './geosol/geosol-option/geosol-option.component';
import { GeotrayMenuComponent } from './geotray/geotray-menu/geotray-menu.component';
import { GooglePlaceModule } from 'ngx-google-places-autocomplete';
import { CommonService } from './Services/common.service';
import { CompassComponent } from './compass/compass.component';
import { DrawSketchComponent } from './draw-sketch/draw-sketch.component';
import { CaptureComponent, FileTypesCountFilter } from './capture/capture.component';
import { CaptureNotesComponent, UrlSafePipe, FormatFileSizePipe } from './capture/capture-notes/capture-notes.component';
import { CloudFileSelectorComponent } from './cloud-file-selector/cloud-file-selector.component';
import { HttpClientService } from './Services/http-client.service';
import { LayersService } from './Services/layers.service';
import { GeoSessionComponent } from './geo-session/geo-session.component';
import { FirebaseService } from './Services/firebase.service';
import { NotificationBarComponent } from './notification-bar/notification-bar.component';
import { GeorefComponent } from './georef/georef.component';
import { UserSignUpComponent } from './user-login/user-sign-up/user-sign-up.component';
import { CustomSpinner } from './Services/SpinnerService';
import { OrganizationComponent } from './user-login/organization/organization.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { UserMgmtComponent } from './user-mgmt/user-mgmt.component';
import { ProjectMgmtComponent } from './project-mgmt/project-mgmt.component';
import { TeamMgmtComponent } from './team-mgmt/team-mgmt.component';
import { GeorefService } from './Services/georef.service';
import { MatRippleModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AnalyticsService } from './Services/analytics.service';
import { MaintenanceScreenComponent } from './maintenance-screen/maintenance-screen.component';
import { AnnotationToolComponent } from './annotation-tool/annotation-tool.component';
import { AnnotationToolService } from './Services/annotation-tool.service';
import { PrintToolService } from './Services/print-tool.service';
import { PrintToolComponent } from './print-tool/print-tool.component';
import { MiniTowerItemComponent } from './geotower/mini-tower-item/mini-tower-item.component';
//import { PropertyWindowComponent } from './geotray/geotray-menu/property-window/property-window.component';
import { PrototypeWindowComponent } from './geotray/prototype-window/prototype-window.component';
import {MatExpansionModule} from '@angular/material/expansion';
//import { PrototypePopupComponent } from './geotray/prototype-popup/prototype-popup.component';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown';
import { SlopeFinderComponent } from './geotray/slope-finder/slope-finder.component';
import { BufferToolComponent } from './geotray/buffer-tool/buffer-tool.component';
import { LongPressDirective } from './geotower/tower-item/long-press.directive';
import { SlopeFinderAEDSComponent } from './geotray/slope-finder-aeds/slope-finder-aeds.component';


const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  };

@NgModule({
  imports: [
    BrowserModule,
    NgbModule, // .forRoot(),
    HttpClientModule,
    FanMenuModule,
    FormsModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    // Ng4LoadingSpinnerModule,
    PerfectScrollbarModule,
    NgProgressModule,
    NgxFileDropModule, // FileDropModule,
    CKEditorModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireStorageModule,
    AngularFireAuthModule,
    AngularDraggableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    DragDropModule,
    NgSlimScrollModule,
    ReactiveFormsModule,
    GooglePlaceModule,
    NgbDropdownModule,
    MatRippleModule,
    MatCheckboxModule,
    MatExpansionModule,
    AngularMultiSelectModule,
    
  ],
  declarations: [
    AppComponent,
    MapCanvasComponent,
    BasemapComponent,
    GeotrayComponent,
    GeosolComponent,
    GeoPopupComponent,
    GeobarComponent,
    GeobarAlertComponent,
    GeotowerComponent,
    TowerItemComponent,
    TowerGroupItemComponent,
    TowerScrollerComponent,
    TowerItemOptionsComponent,
    ConnectionComponent,
    SpecificationComponent,
    FunctionComponent,
    DepictionComponent,
    InteractionComponent,
    UserLoginComponent,
    SocialShareDirective,
    // GeoNotepadComponent,
    DbfTableComponent,
    GeosolOptionComponent,
    GeotrayMenuComponent,
    CompassComponent,
    DrawSketchComponent,
    UrlSafePipe,
    FormatFileSizePipe,
    CaptureComponent,
    FileTypesCountFilter,
    CaptureNotesComponent,
    CloudFileSelectorComponent,
    GeoSessionComponent,
    NotificationBarComponent,
    GeorefComponent,
    UserSignUpComponent,
    OrganizationComponent,
    UserProfileComponent,
    UserMgmtComponent,
    ProjectMgmtComponent,
    TeamMgmtComponent,
    MaintenanceScreenComponent,
    AnnotationToolComponent,
    FormatFileSizePipe,
    PrintToolComponent,
    MiniTowerItemComponent,
    // PropertyWindowComponent,
    PrototypeWindowComponent,
   // PrototypePopupComponent,
    SlopeFinderComponent,
    BufferToolComponent,
    LongPressDirective,
    SlopeFinderAEDSComponent,
    
  ],
  entryComponents: [],
  providers: [
    // { provide: HTTP_INTERCEPTORS, useClass: NgProgressInterceptor, multi: true },
    Logger,
    {
      provide: LoggerOptions, useValue: { level: LoggerLevel.DEBUG }
    },
    ConfigServices,
    GeobarService,
    GeotowerService,
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    },
    {
      provide: SLIMSCROLL_DEFAULTS,
      useValue: {
        alwaysVisible : false
      }
    },
    AuthObservableService,
    SocialAuthService,
    GeoNotePadService,
    CommonService,
    LayersService,
    HttpClientService,
    NgbDropdown,
    FirebaseService,
    CustomSpinner,
    GeorefService,
    AnalyticsService,
    AnnotationToolService,
    PrintToolService
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
    NO_ERRORS_SCHEMA
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { MaintenanceScreenComponent } from './maintenance-screen/maintenance-screen.component';
import { MapCanvasComponent } from './map-canvas/map-canvas.component';

const routes: Routes = [
    { path: 'app', component: AppComponent },
    { path: '', component: MapCanvasComponent },
    { path: 'covid', component: MapCanvasComponent },
    { path: 'session/:sessionId', component: MapCanvasComponent },
    { path: 'session/:sessionId/share/:uuid', component: MapCanvasComponent },
    { path: 'share/:sessionId', component: MapCanvasComponent },
    { path: 'workspace/:workspacename', component: MapCanvasComponent },
    { path: 'maintenance', component: MaintenanceScreenComponent },
    {path: '**', redirectTo: ''},
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

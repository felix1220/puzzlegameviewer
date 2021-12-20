import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'details/:eventId',
    loadChildren: () => import('./details/details.module').then( m => m.DetailsPageModule)
  },
  {
    path: 'puzzlegame',
    loadChildren: () => import('./puzzlegame/puzzlegame.module').then( m => m.PuzzlegamePageModule)
  },
  {
    path: 'finger-draw',
    loadChildren: () => import('./finger-draw/finger-draw.module').then( m => m.FingerDrawPageModule)
  },
  {
    path:'game-view',
    loadChildren: () => import('./game-view/game-view.module').then(m => m.GameViewPageModule)
  },
  {
    path: 'puzzle-viewer',
    loadChildren: () => import('./puzzle-viewer/puzzle-viewer.module').then( m => m.PuzzleViewerPageModule)
  },
  {
    path: 'puzzle-view-helper',
    loadChildren: () => import('./puzzle-view-helper/puzzle-view-helper.module').then( m => m.PuzzleViewHelperPageModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }

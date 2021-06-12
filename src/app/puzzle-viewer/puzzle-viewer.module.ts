import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PuzzleViewerPageRoutingModule } from './puzzle-viewer-routing.module';

import { PuzzleViewerPage } from './puzzle-viewer.page';
import { AngularFireModule } from '@angular/fire';
import { environment } from 'src/environments/environment';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireStorageModule} from '@angular/fire/storage';
import { PuzzleService } from '../services/puzzle.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PuzzleViewerPageRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireModule,
    AngularFireStorageModule
  ],
  declarations: [PuzzleViewerPage],
  providers:[PuzzleService]
})
export class PuzzleViewerPageModule {}

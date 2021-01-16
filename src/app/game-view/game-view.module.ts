import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GameViewPageRoutingModule } from './game-view-routing.module';

import { GameViewPage } from './game-view.component';
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
    GameViewPageRoutingModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFirestoreModule,
    AngularFireAuthModule,
    AngularFireModule,
    AngularFireStorageModule
  ],
  declarations: [GameViewPage],
  providers:[PuzzleService]
})
export class GameViewPageModule {}
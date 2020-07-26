import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Puzzle } from '../models/puzzle';
import {first, map} from 'rxjs/operators';
import { convertSnaps } from './db-utils';

@Injectable({
    providedIn: 'root'
  })
  export class PuzzleService {
    constructor(private db: AngularFirestore) { }

    loadPuzzles(): Observable<Puzzle[]> {
        return this.db.collection(
            'puzzles'
        )
        .snapshotChanges()
        .pipe(
            map(snaps => convertSnaps<Puzzle>(snaps)),
            first()
        )
    }
  }
import { Injectable } from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Puzzle } from '../models/puzzle';
import {first, map, tap} from 'rxjs/operators';
import { convertSnaps } from './db-utils';

@Injectable()
  export class PuzzleService {
    constructor(private db: AngularFirestore) { }

    loadPuzzles(): Observable<Puzzle[]> {
        return this.db.collection(
            'puzzles'
        )
        .snapshotChanges()
        .pipe(
            tap( data => console.log('The tap data => ', data)),
            map(snaps => convertSnaps<Puzzle>(snaps)),
            first()
        )
    }
  }
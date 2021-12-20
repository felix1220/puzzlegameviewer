import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase/app';

@Injectable()
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth
  ) { }

  login(email: string, password: string) {
    this.afAuth.auth.signInWithEmailAndPassword(email, password)
    .then(value => {
      console.log('Nice, it worked!');
      //this.router.navigateByUrl('/profile');
    })
    .catch(err => {
      console.log('Something went wrong: ', err.message);
    });
  }
  emailSignup(email: string, password: string) {
    this.afAuth.auth.createUserWithEmailAndPassword(email, password)
    .then(value => {
     console.log('Sucess', value);
     //this.router.navigateByUrl('/profile');
    })
    .catch(error => {
      console.log('Something went wrong: ', error);
    });
  }
  googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    return this.oAuthLogin(provider)
      .then(value => {
     console.log('Sucess', value);
     //this.router.navigateByUrl('/profile');
   })
    .catch(error => {
      console.log('Something went wrong: ', error);
    });
  }
  logout() {
    this.afAuth.auth.signOut().then(() => {
     // this.router.navigate(['/']);
    });
  }
  private oAuthLogin(provider) {
    return this.afAuth.auth.signInWithPopup(provider);
  }
}

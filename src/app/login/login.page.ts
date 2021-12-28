import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  blnShowNewSignUp: boolean = false;

  constructor(private authService: AuthService, 
    private nav: NavController,
    private router: Router) { }

  ngOnInit() {
    
  }
  loginGoogle() {
    this.authService.googleLogin();
  }
  ngOnDestroy(): void {
      
  }
  newSignUp(): void {
    //this.nav.navigateForward('new-signup/new');
    this.router.navigate(['new-signup/', 'new']);
    //this.blnShowNewSignUp = true;
    //debugger;
  }
  oldSignUp(): void {
    //this.nav.navigateForward('new-signup/old')
    this.router.navigate(['new-signup/', 'old']);
  }

}

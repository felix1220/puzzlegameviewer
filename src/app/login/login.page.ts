import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {

  constructor(private authService: AuthService) { }

  ngOnInit() {
    
  }
  loginGoogle() {
    this.authService.googleLogin();
  }
  ngOnDestroy(): void {
      
  }

}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-new-signup',
  templateUrl: './new-signup.component.html',
  styleUrls: ['./new-signup.component.scss'],
})
export class NewSignupComponent implements OnInit {
  
  email: string;
  pwd: string;
  blnEmailUse: boolean = false;
  blnFormSignUp: boolean  = false;
  loginFailed: boolean = false;

  constructor(private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if(params['type'] === 'new') {
        this.blnFormSignUp = true;
      } else {
        this.blnFormSignUp = false;
      }
    }).unsubscribe();
  }

  signUp(): void {
    if(this.blnFormSignUp) {
      this.authService.emailSignup(this.email, this.pwd).then(value => {
        console.log('Sucess', value);
        this.blnEmailUse = false;
        //this.router.navigateByUrl('/profile');
       })
       .catch(error => {
         this.blnEmailUse = true;
        console.log('Something went wrong: ', error);
      });
    } else {
      this.authService.login(this.email, this.pwd).then(value => {
        console.log('Nice, it worked!');
        this.router.navigate(['puzzle-view-helper']);
        //this.router.navigateByUrl('/profile');
        this.loginFailed = false;
      })
      .catch(err => {
        this.loginFailed = true;
        console.log('Something went wrong: ', err.message);
      });
    }
    
  }

}

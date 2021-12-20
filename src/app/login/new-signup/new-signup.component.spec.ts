import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NewSignupComponent } from './new-signup.component';

describe('NewSignupComponent', () => {
  let component: NewSignupComponent;
  let fixture: ComponentFixture<NewSignupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewSignupComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NewSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FingerDrawPage } from './finger-draw.page';

describe('FingerDrawPage', () => {
  let component: FingerDrawPage;
  let fixture: ComponentFixture<FingerDrawPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FingerDrawPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FingerDrawPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

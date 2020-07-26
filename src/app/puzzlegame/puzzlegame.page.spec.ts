import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PuzzlegamePage } from './puzzlegame.page';

describe('PuzzlegamePage', () => {
  let component: PuzzlegamePage;
  let fixture: ComponentFixture<PuzzlegamePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PuzzlegamePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PuzzlegamePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

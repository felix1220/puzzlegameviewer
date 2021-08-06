import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PuzzleViewHelperPage } from './puzzle-view-helper.page';

describe('PuzzleViewHelperPage', () => {
  let component: PuzzleViewHelperPage;
  let fixture: ComponentFixture<PuzzleViewHelperPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PuzzleViewHelperPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PuzzleViewHelperPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PuzzleViewerPage } from './puzzle-viewer.page';

describe('PuzzleViewerPage', () => {
  let component: PuzzleViewerPage;
  let fixture: ComponentFixture<PuzzleViewerPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PuzzleViewerPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PuzzleViewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

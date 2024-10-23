import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacsimileFileComponent } from './facsimile-file.component';

describe('FacsimileFileComponent', () => {
  let component: FacsimileFileComponent;
  let fixture: ComponentFixture<FacsimileFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacsimileFileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimileFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

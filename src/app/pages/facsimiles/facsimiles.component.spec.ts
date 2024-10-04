import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacsimilesComponent } from './facsimiles.component';

describe('FacsimilesComponent', () => {
  let component: FacsimilesComponent;
  let fixture: ComponentFixture<FacsimilesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacsimilesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacsimilesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

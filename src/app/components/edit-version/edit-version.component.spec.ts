import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditVersionComponent } from './edit-version.component';

describe('EditVersionComponent', () => {
  let component: EditVersionComponent;
  let fixture: ComponentFixture<EditVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditVersionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

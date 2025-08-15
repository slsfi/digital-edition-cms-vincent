import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditDialogComponent } from './edit-dialog.component';

// Simple interface for testing
interface TestData {
  id?: number;
  name?: string;
}

describe('EditDialogComponent', () => {
  let component: EditDialogComponent<TestData>;
  let fixture: ComponentFixture<EditDialogComponent<TestData>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditDialogComponent<TestData>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

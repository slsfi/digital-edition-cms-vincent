import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { EditDialogComponent } from './edit-dialog.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

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
      imports: [EditDialogComponent],
      providers: [
        ...getCommonTestingProviders(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            model: null,
            columns: [],
            title: 'Test'
          }
        }
      ]
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

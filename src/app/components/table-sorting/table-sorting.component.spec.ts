import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TableSortingComponent } from './table-sorting.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

describe('TableSortingComponent', () => {
  let component: TableSortingComponent;
  let fixture: ComponentFixture<TableSortingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSortingComponent],
      providers: [
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: [] }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableSortingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

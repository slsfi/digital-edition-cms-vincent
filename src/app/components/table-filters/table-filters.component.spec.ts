import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { TableFiltersComponent } from './table-filters.component';
import { getCommonTestingProviders } from '../../../testing/test-providers';

describe('TableFiltersComponent', () => {
  let component: TableFiltersComponent;
  let fixture: ComponentFixture<TableFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableFiltersComponent],
      providers: [
        ...getCommonTestingProviders(),
        { provide: MAT_DIALOG_DATA, useValue: [] }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Column } from '../../models/common.model';
import { personTypeOptions } from '../../models/person.model';
import { QueryParamsService } from './../../services/query-params.service';

@Component({
  selector: 'app-table-filters',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule
],
  templateUrl: './table-filters.component.html',
  styleUrl: './table-filters.component.scss'
})
export class TableFiltersComponent implements OnInit {
  private readonly queryParamsService = inject(QueryParamsService);

  readonly data = inject<Column[]>(MAT_DIALOG_DATA);

  form!: FormGroup;
  personTypes = personTypeOptions;

  ngOnInit() {
    this.form = new FormGroup({});
    const queryParams = this.queryParamsService.getQueryParams();
    this.data.forEach((column) => {
      let value = queryParams[column.field] || '';
      if (value && (column.type === 'number' || column.type === 'published')) {
        value = parseInt(value);
      }
      this.form.addControl(column.field, new FormControl(value));
    });
  }

  submit(event: Event) {
    event.preventDefault();
    const params = this.form.value;
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (params[key] === '') {
        params[key] = undefined;
      } else if (typeof value === 'string') {
        params[key] = value.toLowerCase();
      }
    });
    this.queryParamsService.addQueryParams(params);
  }

  reset() {
    this.form.reset();
    this.queryParamsService.addQueryParams(this.form.value);
  }
}

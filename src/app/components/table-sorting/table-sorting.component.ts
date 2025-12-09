import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { Column, QueryParamType } from '../../models/common.model';
import { QueryParamsService } from './../../services/query-params.service';

@Component({
  selector: 'app-table-sorting',
  imports: [
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule
],
  templateUrl: './table-sorting.component.html',
  styleUrl: './table-sorting.component.scss'
})
export class TableSortingComponent implements OnInit {
  private readonly queryParamsService = inject(QueryParamsService);

  readonly data = inject<Column[]>(MAT_DIALOG_DATA);

  form!: FormGroup;
  columns: Column[] = [];

  ngOnInit() {
    const queryParams = this.queryParamsService.getQueryParams();
    this.form = new FormGroup({
      field: new FormControl(queryParams['sort'], Validators.required),
      direction: new FormControl(queryParams['direction'] ?? 'asc', Validators.required)
    });
    this.columns = this.data.filter(column => column.filterable);
  }

  get field() {
    return this.form.get('field');
  }

  get direction() {
    return this.form.get('direction');
  }

  submit(event: Event) {
    event.preventDefault();
    const params: QueryParamType = {
      sort: this.form.value.field,
      direction: this.form.value.direction
    };
    this.queryParamsService.addQueryParams(params);
  }

  reset() {
    this.form.reset();
    const params: QueryParamType = {
      sort: this.form.value.field,
      direction: this.form.value.direction
    };
    this.queryParamsService.addQueryParams(params);
  }
}

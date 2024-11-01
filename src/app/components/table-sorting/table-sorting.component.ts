import { QueryParamsService } from './../../services/query-params.service';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Column, QueryParamType } from '../../models/common';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-table-sorting',
  standalone: true,
  imports: [CommonModule, MatInputModule, MatFormFieldModule, MatSelectModule, ReactiveFormsModule, MatDialogModule, MatButtonModule],
  templateUrl: './table-sorting.component.html',
  styleUrl: './table-sorting.component.scss'
})
export class TableSortingComponent {

  constructor(private queryParamsService: QueryParamsService) { }

  form!: FormGroup;
  readonly data = inject<Column[]>(MAT_DIALOG_DATA);

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

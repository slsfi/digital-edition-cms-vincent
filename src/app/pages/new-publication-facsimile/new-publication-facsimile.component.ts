import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, take } from 'rxjs';

import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { Column } from '../../models/common';
import { FacsimileCollection } from '../../models/facsimile';
import { Publication } from '../../models/publication';
import { FacsimileService } from './../../services/facsimile.service';
import { LoadingService } from '../../services/loading.service';
import { ProjectService } from '../../services/project.service';
import { PublicationService } from '../../services/publication.service';
import { QueryParamsService } from '../../services/query-params.service';

@Component({
  selector: 'app-new-publication-facsimile',
  imports: [
    CommonModule, MatTableModule, CustomTableComponent, MatIconModule, MatBadgeModule, MatButtonModule,
    MatFormFieldModule, ReactiveFormsModule, MatInputModule, RouterLink, LoadingSpinnerComponent
  ],
  templateUrl: './new-publication-facsimile.component.html',
  styleUrl: './new-publication-facsimile.component.scss'
})
export class NewPublicationFacsimileComponent implements OnInit {

  facsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();
  filterParams$;
  publication$: Observable<Publication> = new Observable<Publication>();
  loading$;

  form!: FormGroup;

  columns: Column[] = [
    { field: 'id', header: 'ID', type: 'string', filterable: true },
    { field: 'title', header: 'Title', type: 'string', filterable: true },
    { field: 'description', header: 'Description', type: 'string', filterable: true },
    { field: 'external_url', header: 'External URL', type: 'string', filterable: true },
  ]

  constructor(
    private publicationService: PublicationService,
    private facsimileService: FacsimileService,
    private projectService: ProjectService,
    private queryParamsService: QueryParamsService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.filterParams$ = this.queryParamsService.filterParams$
  }

  get publicationsPath() {
    const publicationCollectionId = this.route.snapshot.paramMap.get('collectionId');
    return ['/publication-collections', publicationCollectionId, 'publication', this.form.value.publication_id]
  }

  ngOnInit() {
    const currentProject = this.projectService.getCurrentProject();
    this.facsimileCollections$ = this.facsimileService.getFacsimileCollections(currentProject);
    const publicationId = parseInt(this.route.snapshot.paramMap.get('publicationId') as string);
    this.publication$ = this.publicationService.getPublication(publicationId, currentProject);
    this.form = new FormGroup({
      publication_id: new FormControl<number>(publicationId, [Validators.required]),
      page_nr: new FormControl<number | null>(1, [Validators.required]),
      section_id: new FormControl<number | null>(null),
      priority: new FormControl<number | null>(1, [Validators.required]),
      facsimile_collection_id: new FormControl<number | null>(null, [Validators.required])
    });
  }

  filter() {
    const columns = this.columns.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      data: columns
    });
  }

  setSelectedRow(rows: FacsimileCollection[]) {
    const row = rows.length > 0 ? rows[0] : null;
    this.form.controls['facsimile_collection_id'].setValue(row?.id);
  }

  submit(event: Event) {
    event.preventDefault();
    const payload = this.form.value;
    if (!payload.page_nr) {
      delete payload.page_nr;
    }
    if (!payload.section_id) {
      delete payload.section_id;
    }
    if (!payload.priority) {
      delete payload.priority;
    }
    const currentProject = this.projectService.getCurrentProject();
    this.publicationService.linkFacsimileToPublication(payload.facsimile_collection_id, payload, currentProject).pipe(take(1)).subscribe({
      next: () => {
        this.snackbar.open('Facsimile linked to publication', 'Close', { panelClass: 'snackbar-success' });
        this.router.navigate(this.publicationsPath);
      }
    });
  }

}

import { FacsimileService } from './../../services/facsimile.service';
import { Component } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { FacsimileCollection } from '../../models/facsimile';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { CustomTableComponent } from '../../components/custom-table/custom-table.component';
import { Column } from '../../models/common';
import { MatIconModule } from '@angular/material/icon';
import { QueryParamsService } from '../../services/query-params.service';
import { MatBadgeModule } from '@angular/material/badge';
import { TableFiltersComponent } from '../../components/table-filters/table-filters.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Publication } from '../../models/publication';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PublicationService } from '../../services/publication.service';

@Component({
  selector: 'app-new-publication-facsimile',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, CustomTableComponent, MatIconModule, MatBadgeModule, MatButtonModule,
    MatFormFieldModule, ReactiveFormsModule, MatInputModule, RouterLink
  ],
  templateUrl: './new-publication-facsimile.component.html',
  styleUrl: './new-publication-facsimile.component.scss'
})
export class NewPublicationFacsimileComponent {

  facsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();
  filterParams$: Observable<any> = new Observable<any>();
  publication$: Observable<Publication> = new Observable<Publication>();

  private facsimilesSource = new BehaviorSubject<FacsimileCollection[]>([]);
  facsimilesResult$: Observable<FacsimileCollection[]> = this.facsimilesSource.asObservable();

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
    private queryParamsService: QueryParamsService,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private snackbar: MatSnackBar) {
      this.filterParams$ = this.queryParamsService.filterParams$
  }

  get publicationsPath() {
    const publicationCollectionId = this.route.snapshot.paramMap.get('collectionId');
    return ['/publication-collections', publicationCollectionId, 'publication', this.form.value.publication_id]
  }

  ngOnInit() {
    this.facsimileCollections$ = this.facsimileService.getFacsimileCollections();
    this.facsimileCollections$.subscribe(facsimiles => {
      this.facsimilesSource.next(facsimiles);
    });
    const publicationId = parseInt(this.route.snapshot.paramMap.get('publicationId') as string);
    this.publication$ = this.publicationService.getPublication(publicationId);
    this.form = new FormGroup({
      publication_id: new FormControl<number>(publicationId, [Validators.required]),
      page_nr: new FormControl<number | null>(null),
      section_id: new FormControl<number | null>(null),
      priority: new FormControl<number | null>(null),
      facsimile_collection_id: new FormControl<number | null>(null, [Validators.required])
    });
  }

  filter() {
    const columns = this.columns.filter(column => column.filterable);
    this.dialog.open(TableFiltersComponent, {
      width: '250px',
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
    this.publicationService.linkFacsimileToPublication(payload.facsimile_collection_id, payload).subscribe({
      next: (response) => {
        this.snackbar.open('Facsimile linked to publication', 'Close', { panelClass: 'snackbar-success' });
        this.router.navigate(this.publicationsPath);
      },
      error: (error) => {
        this.snackbar.open('Error linking facsimile to publication', 'Close', { panelClass: 'snackbar-error' });
      }
    });
  }



}

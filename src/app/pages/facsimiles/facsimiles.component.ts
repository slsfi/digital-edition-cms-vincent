import { Component } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable, startWith, switchMap } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FacsimileCollection } from '../../models/facsimile';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { MatTableModule } from '@angular/material/table';
import { Column } from '../../models/column';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { EditFacsimileComponent } from '../../components/edit-facsimile/edit-facsimile.component';

@Component({
  selector: 'app-facsimiles',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './facsimiles.component.html',
  styleUrl: './facsimiles.component.scss'
})
export class FacsimilesComponent {

  columnsData: Column[] = [
    { field: 'index', header: '#', filterable: false, type: 'index' },
    { field: 'id', header: 'ID', filterable: true, type: 'number', editable: false },
    { field: 'title', header: 'Title', filterable: true, type: 'string', editable: true,},
    { field: 'description', header: 'Description', filterable: true, type: 'string', editable: true },
    { field: 'number_of_pages', header: 'Number of pages', filterable: true, type: 'number', editable: true },
    { field: 'page_comment', header: 'Page comment', filterable: true, type: 'string', editable: true },
    { field: 'start_page_number', header: 'Start page number', filterable: true, type: 'number', editable: true },
    { field: 'external_url', header: 'External URL', filterable: true, type: 'string', editable: true },
    { field: 'folder_path', header: 'Folder path', filterable: true, type: 'string', editable: true },
    { field: 'actions', header: 'Actions', filterable: false, type: 'actions' },
  ]
  displayedColumns: string[] = this.columnsData.map(column => column.field);

  selectedProject$: Observable<string | null> = new Observable<string | null>();
  facsimileCollections$: Observable<FacsimileCollection[]> = new Observable<FacsimileCollection[]>();

  loader$: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(private projectService: ProjectService, private dialog: MatDialog) { }

  ngAfterViewInit() {
    this.selectedProject$ = this.projectService.selectedProject$;
    this.facsimileCollections$ = this.loader$.asObservable().pipe(
      startWith(0),
      switchMap(() => combineLatest([this.selectedProject$, this.projectService.getFacsimileCollections()]).pipe(
        map(([project, facsimiles]) => {
          return facsimiles;
        })
      ))
    );
  }

  editCollection(collection: FacsimileCollection | null = null) {
    console.log('Edit collection', collection);
    const dialogRef = this.dialog.open(EditFacsimileComponent, {
      data: {
        facsimile: collection ?? {},
        columns: this.columnsData.filter(column => column.type != 'index' && column.type != 'actions')
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      if (result) {
        this.loader$.next(0);
      }
    });
  }

}

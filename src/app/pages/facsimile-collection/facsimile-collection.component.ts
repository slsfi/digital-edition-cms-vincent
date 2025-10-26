import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable, take } from 'rxjs';

import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { FacsimileCollection, VerifyFacsimileFileResponse } from '../../models/facsimile.model';
import { FacsimileService } from '../../services/facsimile.service';
import { ProjectService } from '../../services/project.service';
import { RangeArrayPipe } from '../../pipes/range-array.pipe';

@Component({
  selector: 'facsimile-collection',
  imports: [
    MatIconModule, FileUploadComponent, MatButtonModule, RouterLink, CommonModule,
    RangeArrayPipe
  ],
  templateUrl: './facsimile-collection.component.html',
  styleUrl: './facsimile-collection.component.scss'
})
export class FacsimileCollectionComponent implements OnInit {

  collectionId: number;
  facsimile$: Observable<FacsimileCollection> = new Observable<FacsimileCollection>();
  missingFileNumbers: number[] = [];

  constructor(
    private fascimileService: FacsimileService, 
    private projectService: ProjectService,
    private route: ActivatedRoute
  ) {
    this.collectionId = this.route.snapshot.params['id'];
  }

  ngOnInit() {
    const currentProject = this.projectService.getCurrentProject();
    this.facsimile$ = this.fascimileService.getFacsimileCollection(this.collectionId, currentProject);
    this.verifyFacsimileFiles();
  }

  verifyFacsimileFiles() {
    const currentProject = this.projectService.getCurrentProject();
    this.fascimileService.verifyFacsimileFile(this.collectionId, 'all', currentProject).pipe(take(1)).subscribe({
      next: response => {
        this.missingFileNumbers = response.data?.missing_file_numbers || [];
      },
      error: (error: HttpErrorResponse) => {
        const err: VerifyFacsimileFileResponse = error.error;
        this.missingFileNumbers = err.data?.missing_file_numbers || [];
      }
    });
  }
}

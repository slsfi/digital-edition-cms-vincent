import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FacsimileCollection, VerifyFacsimileFileResponse } from '../../models/facsimile';
import { MatIconModule } from '@angular/material/icon';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { MatButtonModule } from '@angular/material/button';
import { FacsimileService } from '../../services/facsimile.service';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'facsimile-collection',
  standalone: true,
  imports: [
    MatIconModule, FileUploadComponent, MatButtonModule, RouterLink, CommonModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './facsimile-collection.component.html',
  styleUrl: './facsimile-collection.component.scss'
})
export class FacsimileCollectionComponent {

  collectionId: number;
  facsimile$: Observable<FacsimileCollection> = new Observable<FacsimileCollection>();
  missingFileNumbers: number[] = [];

  constructor(private fascimileService: FacsimileService, private route: ActivatedRoute) {
    this.collectionId = this.route.snapshot.params['id'];
  }

  ngOnInit() {
    this.facsimile$ = this.fascimileService.getFacsimileCollection(this.collectionId);
    this.vefifyFacsimileFiles();
  }

  vefifyFacsimileFiles() {
    this.fascimileService.verifyFacsimileFile(this.collectionId, 'all').subscribe({
      next: (response: VerifyFacsimileFileResponse) => {
        this.missingFileNumbers = response.data?.missing_file_numbers || [];
      },
      error: (error: HttpErrorResponse) => {
        const err: VerifyFacsimileFileResponse = error.error;
        this.missingFileNumbers = err.data?.missing_file_numbers || [];
      }
    });
  }
}

import { LoadingService } from '../../services/loading.service';
import { Component, Input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FacsimileCollection } from '../../models/facsimile';
import { FacsimileFileComponent } from "../../components/facsimile-file/facsimile-file.component";
import { MatIconModule } from '@angular/material/icon';
import { FileUploadComponent } from '../../components/file-upload/file-upload.component';
import { MatButtonModule } from '@angular/material/button';
import { FacsimileService } from '../../services/facsimile.service';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'facsimile-collection',
  standalone: true,
  imports: [
    FacsimileFileComponent, MatIconModule, FileUploadComponent, MatButtonModule, RouterLink, CommonModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './facsimile-collection.component.html',
  styleUrl: './facsimile-collection.component.scss'
})
export class FacsimileCollectionComponent {

  collectionId: number;
  range: number[] = [];
  firstImageIsValid = false;
  loading$;
  facsimile$: Observable<FacsimileCollection> = new Observable<FacsimileCollection>();

  constructor(private fascimileService: FacsimileService, private loadingService: LoadingService, private route: ActivatedRoute) {
    this.loading$ = this.loadingService.loading$;
    this.collectionId = this.route.snapshot.params['id'];
  }

  ngOnInit() {
    this.facsimile$ = this.fascimileService.getFacsimileCollection(this.collectionId);
    // Check first image url
    this.fascimileService.getFacsimileImagePath(this.collectionId, 1, 1).subscribe
    ({
      next: (path) => {
        this.checkImage(path)
      },
      error: (err) => {
        console.log('error', err);
      }
    })
  }

  checkImage(path: string) {
    this.fascimileService.getFacsimileFile(path)
      .subscribe({
        next: (res) => {
          this.firstImageIsValid = res.status === 200;
        },
        error: (err) => {
          console.log('error', err);
        }
    })
  }
}

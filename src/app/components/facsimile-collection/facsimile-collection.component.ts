import { Component, Input } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { FacsimileCollection } from '../../models/facsimile';
import { FacsimileFileComponent } from "../facsimile-file/facsimile-file.component";
import { MatIconModule } from '@angular/material/icon';
import { FileUploadComponent } from '../file-upload/file-upload.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'facsimile-collection',
  standalone: true,
  imports: [FacsimileFileComponent, MatIconModule, FileUploadComponent, MatButtonModule, RouterLink],
  templateUrl: './facsimile-collection.component.html',
  styleUrl: './facsimile-collection.component.scss'
})
export class FacsimileCollectionComponent {

  @Input() collection!: FacsimileCollection;

  range: number[] = [];
  firstImageIsValid = false;

  constructor(
    private route: ActivatedRoute,
    private projectService: ProjectService
  ) {
   }

  ngOnInit() {
    this.range = Array.from({ length: this.collection.number_of_pages ?? 0 }, (_, i) => i + 1);
    // Check first image url
    this.projectService.getFacsimileImagePath(this.collection.id, 1, 1).subscribe
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
    this.projectService.getFacsimileFile(path)
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

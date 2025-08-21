import { AfterViewInit, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpContext } from '@angular/common/http';
import { BehaviorSubject, map } from 'rxjs';

import { SkipLoading } from '../../interceptors/loading.interceptor';
import { FacsimileService } from '../../services/facsimile.service';
import { ApiService } from '../../services/api.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'facsimile-file',
  imports: [CommonModule],
  templateUrl: './facsimile-file.component.html',
  styleUrl: './facsimile-file.component.scss'
})
export class FacsimileFileComponent implements AfterViewInit {
  @Input({ required: true }) collectionId!: number;
  @Input({ required: true }) pageNumber!: number;
  @Input() zoom: 1 | 2 | 3 | 4 = 1;

  imagePath = '';

  private imageUrlSubject = new BehaviorSubject<string>('');
  imageUrl$ = this.imageUrlSubject.asObservable();

  constructor(
    private facsimileService: FacsimileService, 
    private apiService: ApiService,
    private projectService: ProjectService
  ) {

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadImage();
    });
  }

  loadImage() {
    const currentProject = this.projectService.getCurrentProject();
    this.imagePath = this.facsimileService.getFacsimileImagePath(this.collectionId, this.pageNumber, currentProject, this.zoom);
    const options = {
      context: new HttpContext().set(SkipLoading, true),
      responseType: 'blob'
    }
    this.apiService
      .get<Blob>(this.imagePath, options, true)
      .pipe(map(response => URL.createObjectURL(response)))
      .subscribe({
        next: url => this.imageUrlSubject.next(url),
      });
  }

}

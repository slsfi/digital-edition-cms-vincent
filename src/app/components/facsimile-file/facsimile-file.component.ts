import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FacsimileService } from '../../services/facsimile.service';
import { ApiService } from '../../services/api.service';
import { BehaviorSubject, map } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { SkipLoading } from '../../interceptors/loading.interceptor';

@Component({
  selector: 'facsimile-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facsimile-file.component.html',
  styleUrl: './facsimile-file.component.scss'
})
export class FacsimileFileComponent {
  @Input({ required: true }) collectionId!: number;
  @Input({ required: true }) pageNumber!: number;
  @Input() zoom: 1|2|3|4 = 1;

  imagePath: string = '';

  private imageUrlSubject = new BehaviorSubject<string>('');
  imageUrl$ = this.imageUrlSubject.asObservable();

  constructor(private facsimileService: FacsimileService, private apiService: ApiService) {

  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.loadImage();
    });
  }

  loadImage() {
    this.imagePath = this.facsimileService.getFacsimileImagePath(this.collectionId, this.pageNumber, this.zoom);
    const options = {
      context: new HttpContext().set(SkipLoading, true),
      responseType: 'blob'
    }
    this.apiService
      .get(this.imagePath, options, true)
      .pipe(map(response => URL.createObjectURL(response)))
      .subscribe({
        next: url => this.imageUrlSubject.next(url),
        error: () => {}
      });
  }


}

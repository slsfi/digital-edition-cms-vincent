import { Component, input } from '@angular/core';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FacsimileService } from '../../services/facsimile.service';

@Component({
  selector: 'facsimile-file',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facsimile-file.component.html',
  styleUrl: './facsimile-file.component.scss'
})
export class FacsimileFileComponent {
  collectionId = input.required<number>();
  pageNumber = input.required<number>();
  zoom = input<1|2|3|4>(1);

  imagePath$: Observable<string> = new Observable<string>();

  constructor(private facsimileService: FacsimileService) { }

  ngOnInit() {
    this.imagePath$ = this.facsimileService.getFacsimileImagePath(this.collectionId(), this.pageNumber(), this.zoom());
  }

}

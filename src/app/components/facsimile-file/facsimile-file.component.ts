import { Component, input } from '@angular/core';
import {  catchError, Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';

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

  constructor(private projectService: ProjectService) { }

  ngOnInit() {
    this.imagePath$ = this.projectService.getFacsimileImagePath(this.collectionId(), this.pageNumber(), this.zoom());
  }

}

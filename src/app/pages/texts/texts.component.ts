import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { Publication } from '../../models/publication';

@Component({
  selector: 'app-texts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './texts.component.html',
  styleUrl: './texts.component.scss'
})
export class TextsComponent {

  $publications: Observable<Publication[]> = new Observable<Publication[]>();

  constructor(private projectService: ProjectService) {
    this.$publications = this.projectService.getPublications();
  }

}

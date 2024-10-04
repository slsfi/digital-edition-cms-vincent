import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { Facsimile } from '../../models/facsimile';

@Component({
  selector: 'app-facsimiles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facsimiles.component.html',
  styleUrl: './facsimiles.component.scss'
})
export class FacsimilesComponent {

  $facsimiles: Observable<Facsimile[]> = new Observable<Facsimile[]>();

  constructor(private projectService: ProjectService) {
    this.$facsimiles = this.projectService.getFacsimiles();
  }

}

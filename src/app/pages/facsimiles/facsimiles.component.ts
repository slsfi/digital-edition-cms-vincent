import { Component } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { Facsimile } from '../../models/facsimile';
import { Project } from '../../models/project';

@Component({
  selector: 'app-facsimiles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './facsimiles.component.html',
  styleUrl: './facsimiles.component.scss'
})
export class FacsimilesComponent {

  $selectedProject: Observable<string | null> = new Observable<string | null>();
  $facsimiles: Observable<Facsimile[]> = new Observable<Facsimile[]>();

  constructor(private projectService: ProjectService) { }

  ngAfterViewInit() {
    this.$selectedProject = this.projectService.$selectedProject;
    this.$facsimiles = combineLatest([this.$selectedProject, this.projectService.getFacsimiles()])
      .pipe(
        map(([project, facsimiles]) => {
          return facsimiles;
        }),
      );
  }

}

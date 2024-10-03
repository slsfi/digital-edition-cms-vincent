import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'main-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  $facsimiles: Observable<any> = new Observable<any>();

  constructor(private projectSevice: ProjectService) {
    this.$facsimiles = this.projectSevice.getFacsimiles();
  }

}

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { Person } from '../../models/person';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './persons.component.html',
  styleUrl: './persons.component.scss'
})
export class PersonsComponent {

  $subjects: Observable<Person[]> = new Observable<Person[]>();

  constructor(private projectService: ProjectService) {
    this.$subjects = this.projectService.getSubjects();
  }
}

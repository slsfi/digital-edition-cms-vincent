import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'loading-spinner',
  imports: [MatProgressSpinnerModule, NgClass],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss'
})
export class LoadingSpinnerComponent {
  overlay = input<boolean>(false);

}

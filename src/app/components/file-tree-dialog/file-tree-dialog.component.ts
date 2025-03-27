import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FileTreeComponent } from '../file-tree/file-tree.component';

@Component({
  selector: 'file-tree-dialog',
  imports: [
    MatTreeModule, MatButtonModule, MatIconModule, CommonModule, MatDialogModule,
    FileTreeComponent
  ],
  templateUrl: './file-tree-dialog.component.html',
  styleUrl: './file-tree-dialog.component.scss'
})
export class FileTreeDialogComponent implements OnInit {
  readonly filename = inject<string>(MAT_DIALOG_DATA);

  filePath = '';

  ngOnInit() {
    this.filePath = this.filename;
  }

  get selectedNodes() {
    return this.filePath.split('/');
  }


}

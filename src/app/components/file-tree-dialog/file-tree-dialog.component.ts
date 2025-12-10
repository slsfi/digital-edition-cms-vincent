import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';

import { FileTreeComponent } from '../file-tree/file-tree.component';
import { SoftWrapPathPipe } from '../../pipes/soft-wrap-path.pipe';

@Component({
  selector: 'file-tree-dialog',
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTreeModule,
    FileTreeComponent,
    SoftWrapPathPipe
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

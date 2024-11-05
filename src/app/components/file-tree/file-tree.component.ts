import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule } from '@angular/material/tree';
import { map, Subject, takeUntil } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

interface TreeNode {
  name: string;
  children: TreeNode[];
  level: number;
}

@Component({
  selector: 'file-tree',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent, CommonModule, MatDialogModule],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss'
})
export class FileTreeComponent {
  readonly filename = inject<string>(MAT_DIALOG_DATA);

  private destroy$ = new Subject<void>();

  @Input() value: string | null = '';
  @Input() onlyFiles: boolean = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() fileSelected = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  dataSource: TreeNode[] = [];
  loading: boolean = true;
  selectedNodes: string[] = [];

  constructor(private projectService: ProjectService) {
  }

  ngOnInit() {
    if (this.value) {
      this.selectedNodes = this.value.split('/');
    }
    if (this.filename && typeof this.filename === 'string') {
      this.selectedNodes = this.filename.split('/');
    } else {
      this.selectedNodes = this.value?.split('/') || [];
    }

    this.projectService.getFileTree()
      .pipe(
        takeUntil(this.destroy$),
        map((fileTree) => this.convertToTreeNode(fileTree))
      )
      .subscribe((data: TreeNode[]) => {
        this.dataSource = data;
        if (data.length > 0) {
          this.loading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get selectedNodeName() {
    return this.selectedNodes[this.selectedNodes.length - 1];
  }

  childrenAccessor = (node: TreeNode) => node.children ?? [];
  hasChild = (_: number, node: TreeNode) => {
    return node.children.length > 0;
  }

  convertToTreeNode(data: any, level: number = 0): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const node: TreeNode = {
          name: key,
          children: [],
          level: level
        };

        // If the value is an object, recurse
        if (data[key] && typeof data[key] === 'object') {
          node.children = this.convertToTreeNode(data[key], level + 1);
        }

        result.push(node);
      }
    }

    return result;
  }

  select(node: TreeNode) {
    this.selectedNodes = this.getNodes(node);
    this.valueChange.emit(this.selectedNodes.join('/'));
  }

  getNodes(targetNode: TreeNode): string[] {
    const path: TreeNode[] = [];

    function findPath(nodes: TreeNode[], target: TreeNode): boolean {
      for (const node of nodes) {
        // Add current node to the path
        path.push(node);

        // If the current node is the target, we found the path
        if (node === target) {
          return true;
        }

        // Recurse on children if any
        if (node.children && findPath(node.children, target)) {
          return true;
        }

        // Remove the node if not part of the path to target
        path.pop();
      }
      return false;
    }

    // Start the recursive search
    findPath(this.dataSource, targetNode);

    return path.map(node => node.name);
  }

  isSelected(node: TreeNode): boolean {
    const idx = this.selectedNodes.indexOf(node.name);
    return idx === node.level;
  }

  selected() {
    this.fileSelected.emit(this.selectedNodes.join('/'));
  }

  previous() {
    this.close.emit();
  }

}

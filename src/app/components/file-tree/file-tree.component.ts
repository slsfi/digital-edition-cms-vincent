import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule, MatTreeFlattener, MatTreeFlatDataSource } from '@angular/material/tree';
import { map, Observable } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { LoadingSpinnerComponent } from "../loading-spinner/loading-spinner.component";

interface TreeNode {
  name: string;
  children: TreeNode[];
}

interface FlatTreeNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'file-tree',
  standalone: true,
  imports: [MatTreeModule, MatButtonModule, MatIconModule, LoadingSpinnerComponent],
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss'
})
export class FileTreeComponent {

  @Output('selectedChange') selectedChange = new EventEmitter<string[]>();

  fileTree$: Observable<any> = new Observable<any>();

  treeControl: FlatTreeControl<FlatTreeNode>;
  treeFlattener: MatTreeFlattener<TreeNode, FlatTreeNode>;
  dataSource: MatTreeFlatDataSource<TreeNode, FlatTreeNode>;
  loading: boolean = true;

  subscription;

  selectedNodes: string[] = [];

  constructor(private projectService: ProjectService) {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<FlatTreeNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

    // Fetch file tree data
    this.subscription = this.projectService.getProjectFileTree().pipe(
      map((fileTree) => this.convertToTreeNode(fileTree))
    ).subscribe((data: TreeNode[]) => {
      this.dataSource.data = data;
      this.loading = false;
    });
  }

  ngOnInit() {
    this.fileTree$ = this.projectService.getProjectFileTree().pipe(
      map((fileTree) => {
        const tree = this.convertToTreeNode(fileTree);
        return tree
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }


  // Transformer to flatten the tree data
  private transformer = (node: TreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level
    };
  }

  // Getters for tree control
  private getLevel = (node: FlatTreeNode) => node.level;
  private isExpandable = (node: FlatTreeNode) => node.expandable;
  private getChildren = (node: TreeNode): TreeNode[] => node.children;
  hasChild = (_: number, node: FlatTreeNode) => node.expandable;

  convertToTreeNode(data: any): TreeNode[] {
    const result: TreeNode[] = [];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const node: TreeNode = {
          name: key,
          children: []
        };

        // If the value is an object, recurse
        if (data[key] && typeof data[key] === 'object') {
          node.children = this.convertToTreeNode(data[key]);
        }

        result.push(node);
      }
    }

    return result;
  }

  select(node: FlatTreeNode) {
    const parentNodes = this.getParentNodes(node);
    this.selectedNodes = [...parentNodes.map(node => node.name), node.name];
    this.selectedChange.emit(this.selectedNodes);
  }

    // Method to find the parent nodes of a selected node
    getParentNodes(node: FlatTreeNode): FlatTreeNode[] {
      const parentNodes: FlatTreeNode[] = [];
      let currentLevel = node.level;
      // Traverse backwards through the tree control data to find parent nodes
      for (let i = this.treeControl.dataNodes.indexOf(node) - 1; i >= 0; i--) {
        const currentNode = this.treeControl.dataNodes[i];
        if (currentNode.level < currentLevel) {
          parentNodes.unshift(currentNode);  // Add to the front of the list (parents should be ordered)
          currentLevel = currentNode.level;
        }
      }

      return parentNodes;
    }

}

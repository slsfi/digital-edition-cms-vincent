import { Pipe, PipeTransform } from '@angular/core';
import type { TocContainer, TocNode, TocRoot, TocSectionNode } from '../models/table-of-contents';

@Pipe({
  name: 'canMoveNodeDown'
})
export class CanMoveNodeDownPipe implements PipeTransform {
  transform(
    toc: TocRoot | undefined | null,
    nodePath: number[] | undefined | null
  ): boolean {
    if (!toc || !nodePath || nodePath.length === 0) return false;

    const parentPath = nodePath.slice(0, -1);
    const index = nodePath[nodePath.length - 1]!;
    const parent = this.getContainerAtPath(toc, parentPath);
    if (!parent) return false;

    return index < parent.children.length - 1;
  }

  private isSectionNode(n: TocNode | undefined): n is TocSectionNode {
    return !!n && n.type === 'section' && Array.isArray(n.children);
  }

  /** Walk down to the container at `path`. Root is a container; each
   * step must land on a section node. */
  private getContainerAtPath(toc: TocRoot, path: number[]): TocContainer | undefined {
    let container: TocContainer = toc;
    for (const idx of path) {
      const child: TocNode | undefined = container.children[idx];
      if (!this.isSectionNode(child)) return undefined;
      container = child;
    }
    return container;
  }
}

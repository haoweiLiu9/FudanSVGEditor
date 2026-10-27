import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class GroupCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string, private readonly members: readonly string[]) { super(doc); }
  protected override perform(): string { const group = this.document.group(this.id, this.members); return `${group.label} created with ${group.children.length} children`; }
}

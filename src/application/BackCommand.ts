import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class BackCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string) { super(doc); }
  protected override perform(): string { this.document.reorder(this.id, false); return `${this.document.find(this.id).label} moved to back`; }
}

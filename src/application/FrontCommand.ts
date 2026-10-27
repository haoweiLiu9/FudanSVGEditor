import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class FrontCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string) { super(doc); }
  protected override perform(): string { this.document.reorder(this.id, true); return `${this.document.find(this.id).label} moved to front`; }
}

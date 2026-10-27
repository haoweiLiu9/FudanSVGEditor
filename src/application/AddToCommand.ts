import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class AddToCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly groupId: string, private readonly id: string) { super(doc); }
  protected override perform(): string { const label = this.document.find(this.id).label; this.document.addTo(this.groupId, this.id); return `${label} added to g#${this.groupId}`; }
}

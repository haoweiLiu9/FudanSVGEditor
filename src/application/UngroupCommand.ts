import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class UngroupCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string) { super(doc); }
  protected override perform(): string { return `g#${this.id} ungrouped (${this.document.ungroup(this.id)} children promoted)`; }
}

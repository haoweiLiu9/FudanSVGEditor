import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class DeleteCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string) { super(doc); }
  protected override perform(): string { return this.edits.delete(this.id); }
}

import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class CreateCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly type: string, private readonly id: string, private readonly params: readonly string[], private readonly parentId?: string) { super(doc); }
  protected override perform(): string { return this.edits.create(this.type, this.id, this.params, this.parentId); }
}

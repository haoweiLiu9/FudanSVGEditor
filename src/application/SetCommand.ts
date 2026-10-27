import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class SetCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string, private readonly attr: string, private readonly value: string) { super(doc); }
  protected override perform(): string { return this.edits.set(this.id, this.attr, this.value); }
}

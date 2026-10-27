import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class ScaleCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string, private readonly factor: number) { super(doc); }
  protected override perform(): string { return this.edits.scale(this.id, this.factor); }
}

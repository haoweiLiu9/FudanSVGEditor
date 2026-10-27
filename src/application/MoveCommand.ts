import { SvgDocument } from '../domain/SvgDocument.js';
import { SnapshotCommand } from './SnapshotCommand.js';
export class MoveCommand extends SnapshotCommand {
  constructor(doc: SvgDocument, private readonly id: string, private readonly dx: number, private readonly dy: number) { super(doc); }
  protected override perform(): string { return this.edits.move(this.id, this.dx, this.dy); }
}

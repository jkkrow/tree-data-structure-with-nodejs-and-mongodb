import { Schema, model } from 'mongoose';

export interface Node {
  id: string;
  parentId: string | null;
  level: number;
  info: { name: string; description: string };
}

export interface NodeDTO extends Node {
  children: NodeDTO[];
}

export interface NodeAggregateResult extends Node {
  children: Node[];
}

const nodeSchema = new Schema<Node>({
  id: { type: String, required: true, unique: true },
  parentId: { type: String, default: null, ref: 'Node' },
  level: { type: Number, required: true },
  info: {
    name: { type: String },
    description: { type: String },
  },
});

export const NodeModel = model<Node>('Node', nodeSchema);

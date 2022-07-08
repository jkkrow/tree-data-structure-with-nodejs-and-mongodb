import { Schema, model } from 'mongoose';

import { NodeAggregateResult, NodeDto } from './node.model';

export interface Tree {
  root: string;
  info: { name: string; description: string };
}

export interface TreeDto extends Omit<Tree, 'root'> {
  root: NodeDto;
}

export interface TreeAggregateResult extends Omit<Tree, 'root'> {
  root: NodeAggregateResult;
}

const treeSchema = new Schema<Tree>({
  root: { type: String, required: true, unique: true, ref: 'Node' },
  info: {
    name: { type: String },
    description: { type: String },
  },
});

export const TreeModel = model<Tree>('Tree', treeSchema);

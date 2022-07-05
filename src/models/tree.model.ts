import { Schema, model } from 'mongoose';

import { NodeAggregateResult, NodeDTO } from './node.model';

export interface Tree {
  root: string;
  info: { name: string; description: string };
}

export interface TreeDTO extends Omit<Tree, 'root'> {
  root: NodeDTO;
}

export interface TreeAggregateResult extends Omit<Tree, 'root'> {
  root: NodeAggregateResult;
}

const treeSchema = new Schema({
  root: { type: String, required: true, unique: true, ref: 'Node' },
  info: {
    name: { type: String },
    description: { type: String },
  },
});

export const TreeModel = model<Tree>('Tree', treeSchema);

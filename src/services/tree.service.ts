import { TreeDTO, TreeAggregateResult, TreeModel } from '../models/tree.model';
import { buildTree } from '../util/tree';

export const upsert = async (treeDTO: TreeDTO) => {
  const treeDocument = await TreeModel.findOne({ root: treeDTO.root.id });

  if (!treeDocument) {
    const newTree = new TreeModel({ ...treeDTO, root: treeDTO.root.id });
    return await newTree.save();
  }

  treeDocument.info = { ...treeDocument.info, ...treeDTO.info };

  return await treeDocument.save();
};

export const remove = async (rootId: string) => {
  const treeDocument = await TreeModel.findOne({ root: rootId });

  if (!treeDocument) {
    throw new Error('Not found');
  }

  return await treeDocument.remove();
};

export const findWithRoot = async () => {
  return await TreeModel.aggregate<TreeDTO>([
    {
      $lookup: {
        from: 'nodes',
        localField: 'root',
        foreignField: 'id',
        as: 'root',
      },
    },
    { $unwind: '$root' },
  ]);
};

export const findOneWithNodes = async (rootId: string) => {
  const result = await TreeModel.aggregate<TreeAggregateResult>([
    { $match: { root: rootId } },
    {
      $lookup: {
        from: 'nodes',
        let: { root: '$root' },
        as: 'root',
        pipeline: [
          { $match: { $expr: { $eq: ['$$root', '$id'] } } },
          {
            $graphLookup: {
              from: 'nodes',
              startWith: '$id',
              connectFromField: 'id',
              connectToField: 'parentId',
              as: 'children',
            },
          },
        ],
      },
    },
    { $unwind: '$root' },
  ]);

  if (!result.length) {
    return null;
  }

  const treeWithNodes = result[0];
  const nodes = [treeWithNodes.root, ...treeWithNodes.root.children];
  const root = buildTree(nodes);

  const treeDTO: TreeDTO = { ...treeWithNodes, root };

  return treeDTO;
};

import { TreeDto, TreeAggregateResult, TreeModel } from '../models/tree.model';
import { buildTree } from '../util/tree';

export const upsert = async (treeDto: TreeDto) => {
  const treeDocument = await TreeModel.findOne({ root: treeDto.root.id });

  if (!treeDocument) {
    const newTree = new TreeModel({ ...treeDto, root: treeDto.root.id });
    return await newTree.save();
  }

  treeDocument.info = { ...treeDocument.info, ...treeDto.info };

  return await treeDocument.save();
};

export const remove = async (rootId: string) => {
  const treeDocument = await TreeModel.findOne({ root: rootId });

  if (!treeDocument) {
    return;
  }

  return await treeDocument.remove();
};

export const findWithRoot = async () => {
  return await TreeModel.aggregate<TreeDto>([
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

  const treeDto: TreeDto = { ...treeWithNodes, root };

  return treeDto;
};

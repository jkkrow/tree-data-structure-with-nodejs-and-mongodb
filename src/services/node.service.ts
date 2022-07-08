import {
  NodeModel,
  Node,
  NodeDto,
  NodeAggregateResult,
} from '../models/node.model';
import { TreeDto } from '../models/tree.model';
import { traverseNodes } from '../util/tree';

export const findByTree = async (rootId: string) => {
  const result = await NodeModel.aggregate<NodeAggregateResult>([
    { $match: { id: rootId } },
    {
      $graphLookup: {
        from: 'nodes',
        startWith: '$id',
        connectFromField: 'id',
        connectToField: 'parentId',
        as: 'children',
      },
    },
  ]);

  const rootWithNodes = result[0];
  const nodes = rootWithNodes ? [rootWithNodes, ...rootWithNodes.children] : [];

  return nodes;
};

export const upsertByTree = async (treeDto: TreeDto) => {
  const newNodes = traverseNodes(treeDto.root);
  const prevNodes = await findByTree(treeDto.root.id);

  // Find created nodes
  const createdNodes = newNodes.filter(
    (newNode) => !prevNodes.some((prevNode) => newNode.id === prevNode.id)
  );
  // Find updated nodes
  const updatedNodes = newNodes.filter((newNode) =>
    prevNodes.some((prevNode) => newNode.id === prevNode.id)
  );
  // Find deleted nodes
  const deletedNodes = prevNodes.filter(
    (prevNode) => !newNodes.some((newNode) => newNode.id === prevNode.id)
  );

  const bulkJobs: any[] = [];

  if (createdNodes.length) {
    bulkJobs.push(..._getInsertJobs(createdNodes));
  }
  if (updatedNodes.length) {
    bulkJobs.push(..._getUpdateJobs(updatedNodes));
  }
  if (deletedNodes.length) {
    bulkJobs.push(..._getDeleteJobs(deletedNodes));
  }

  return await NodeModel.bulkWrite(bulkJobs);
};

export const removeByTree = async (rootId: string) => {
  const prevNodes = await findByTree(rootId);
  const deleteBulk = _getDeleteJobs(prevNodes);

  return await NodeModel.bulkWrite(deleteBulk);
};

const _getInsertJobs = (nodes: (Node | NodeDto)[]) => {
  const insertBulk = nodes.map((node) => ({
    insertOne: { document: node },
  }));

  return insertBulk;
};

const _getUpdateJobs = (nodes: (Node | NodeDto)[]) => {
  const updateBulk = nodes.map((node) => ({
    updateOne: {
      filter: { id: node.id },
      update: { $set: { info: node.info } },
    },
  }));

  return updateBulk;
};

const _getDeleteJobs = (nodes: (Node | NodeDto)[]) => {
  const deleteBulk = [
    {
      deleteMany: {
        filter: { id: { $in: nodes.map((node) => node.id) } },
      },
    },
  ];

  return deleteBulk;
};

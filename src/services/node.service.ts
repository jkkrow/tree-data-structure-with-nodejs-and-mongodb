import {
  NodeModel,
  Node,
  NodeDTO,
  NodeAggregateResult,
} from '../models/node.model';
import { TreeDTO } from '../models/tree.model';
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
        // restrictSearchWithMatch: { creator: userId },
      },
    },
  ]);

  const rootWithNodes = result[0];
  const nodes = rootWithNodes ? [rootWithNodes, ...rootWithNodes.children] : [];

  return nodes;
};

export const upsertByTree = async (treeDTO: TreeDTO) => {
  const newNodes = traverseNodes(treeDTO.root);
  const prevNodes = await findByTree(treeDTO.root.id);

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

const _getInsertJobs = (nodes: (Node | NodeDTO)[]) => {
  const insertBulk = nodes.map((node) => ({
    insertOne: { document: node },
  }));

  return insertBulk;
};

const _getUpdateJobs = (nodes: (Node | NodeDTO)[]) => {
  const updateBulk = nodes.map((node) => ({
    updateOne: {
      filter: { id: node.id },
      update: { $set: { info: node.info } },
    },
  }));

  return updateBulk;
};

const _getDeleteJobs = (nodes: (Node | NodeDTO)[]) => {
  const deleteBulk = [
    {
      deleteMany: {
        filter: { id: { $in: nodes.map((node) => node.id) } },
      },
    },
  ];

  return deleteBulk;
};

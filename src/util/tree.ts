import { Node, NodeDTO } from '../models/node.model';

export const traverseNodes = (root: NodeDTO) => {
  let currentNode = root;
  const queue: NodeDTO[] = [];
  const nodes: NodeDTO[] = [];

  queue.push(currentNode);

  while (queue.length) {
    currentNode = queue.shift()!;

    nodes.push(currentNode);

    if (currentNode.children.length) {
      currentNode.children.forEach((child) => queue.push(child));
    }
  }

  return nodes;
};

export const buildTree = (nodes: Node[]) => {
  const map: any = {};
  let root: NodeDTO = {
    id: '',
    parentId: null,
    level: 0,
    info: { name: '', description: '' },
    children: [],
  };

  const nodeDTOs: NodeDTO[] = nodes.map((node, index) => {
    map[node.id] = index;
    const nodeDTO = { ...node, children: [] };

    return nodeDTO;
  });

  nodeDTOs.forEach((node) => {
    if (node.parentId) {
      nodeDTOs[map[node.parentId]].children.push(node);
    } else {
      root = node;
    }
  });

  return root;
};

import { Node, NodeDto } from '../models/node.model';

export const traverseNodes = (root: NodeDto) => {
  let currentNode = root;
  const queue: NodeDto[] = [];
  const nodes: NodeDto[] = [];

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
  const map: { [key: string]: number } = {};
  let root: NodeDto = {
    id: '',
    parentId: null,
    level: 0,
    info: { name: '', description: '' },
    children: [],
  };

  const nodeDtos: NodeDto[] = nodes.map((node, index) => {
    map[node.id] = index;
    const nodeDto = { ...node, children: [] };

    return nodeDto;
  });

  nodeDtos.forEach((node) => {
    if (node.parentId) {
      nodeDtos[map[node.parentId]].children.push(node);
    } else {
      root = node;
    }
  });

  return root;
};

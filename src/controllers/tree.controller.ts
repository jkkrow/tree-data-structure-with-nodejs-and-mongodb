import express from 'express';

import * as TreeService from '../services/tree.service';
import * as NodeService from '../services/node.service';

const router = express.Router();

router.get('/', async (req, res) => {
  const trees = await TreeService.findWithRoot();

  res.json({ trees });
});

router.get('/:rootId', async (req, res) => {
  const { rootId } = req.params;

  const tree = await TreeService.findOneWithNodes(rootId);

  res.json({ tree });
});

router.put('/', async (req, res) => {
  const { tree } = req.body;

  await TreeService.upsert(tree);
  await NodeService.upsertByTree(tree);

  res.json({ message: 'Updated tree and nodes' });
});

router.delete('/:rootId', async (req, res) => {
  const { rootId } = req.params;

  await TreeService.remove(rootId);
  await NodeService.removeByTree(rootId);

  res.json({ message: 'Removed tree and nodes' });
});

export default router;

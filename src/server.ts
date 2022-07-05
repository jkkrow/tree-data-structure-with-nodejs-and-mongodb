import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { connectDB } from './config/db';
import treeController from './controllers/tree.controller';

const PORT = 5000;

const app = express();

app.use(express.json());
app.use(cors());

app.use('/api/trees', treeController);

const initiateServer = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
  });
};

initiateServer();

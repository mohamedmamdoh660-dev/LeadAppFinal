import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import usersRouter from './routes/users.js';
import leadsRouter from './routes/leads.js';
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';
import rolesRouter from './routes/roles.js';

const app = express();
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || '*',
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/leads', leadsRouter);
app.use('/tasks', tasksRouter);
app.use('/roles', rolesRouter);

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;

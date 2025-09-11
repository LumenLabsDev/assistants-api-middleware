import { FastifyInstance } from 'fastify';
import { AssistantsService, ThreadsService, RunsService } from '../../application/services.js';
import { toAssistantResource, toList, toMessageResource, toRunResource, toThreadResource } from './presenters.js';
import { AssistantCreateSchema, AssistantUpdateSchema, MessageCreateSchema, RunCreateSchema, validate } from './schemas.js';
import { NotFoundError } from '../../domain/errors.js';

/**
 * Registers Assistants-like HTTP controllers.
 *
 * Routes are validated with Zod and mapped through presenters to match
 * Assistants API response shapes.
 *
 * @param app Fastify instance to register routes on
 * @param deps Resolved application services
 */
export function buildControllers(app: FastifyInstance, deps: {
  assistants: AssistantsService;
  threads: ThreadsService;
  runs: RunsService;
}) {
  app.post('/v1/assistants', async (req, reply) => {
    const body = validate(AssistantCreateSchema, req.body ?? {});
    const assistant = await deps.assistants.create(body);
    return reply.code(201).send(toAssistantResource(assistant));
  });

  app.get('/v1/assistants', async (_req, reply) => {
    const data = (await deps.assistants.list()).map(toAssistantResource);
    return reply.send(toList(data));
  });

  app.get('/v1/assistants/:assistant_id', async (req, reply) => {
    const { assistant_id } = req.params as { assistant_id: string };
    const assistant = await deps.assistants.requireAssistant(assistant_id);
    return reply.send(toAssistantResource(assistant));
  });

  app.post('/v1/assistants/:assistant_id', async (req, reply) => {
    const { assistant_id } = req.params as { assistant_id: string };
    const body = validate(AssistantUpdateSchema, req.body ?? {});
    const updated = await deps.assistants.update(assistant_id, body);
    if (!updated) throw new NotFoundError('assistant_not_found');
    return reply.send(toAssistantResource(updated));
  });

  app.post('/v1/threads', async (_req, reply) => {
    const t = await deps.threads.createThread();
    return reply.code(201).send(toThreadResource(t));
  });

  app.get('/v1/threads/:thread_id/messages', async (req, reply) => {
    const { thread_id } = req.params as { thread_id: string };
    await deps.threads.requireThread(thread_id);
    const data = (await deps.threads.listMessages(thread_id)).map(toMessageResource);
    return reply.send(toList(data));
  });

  app.post('/v1/threads/:thread_id/messages', async (req, reply) => {
    const { thread_id } = req.params as { thread_id: string };
    await deps.threads.requireThread(thread_id);
    const body = validate(MessageCreateSchema, req.body ?? {});
    const role = (body.role ?? 'user') as 'user' | 'assistant' | 'system';
    const content = body.content ?? '';
    const msg = await deps.threads.addMessage({ threadId: thread_id, role, content });
    return reply.code(201).send(toMessageResource(msg));
  });

  app.post('/v1/threads/:thread_id/runs', async (req, reply) => {
    const { thread_id } = req.params as { thread_id: string };
    const body = validate(RunCreateSchema, req.body ?? {});
    await deps.threads.requireThread(thread_id);
    const run = await deps.runs.createRun({ threadId: thread_id, assistantId: body.assistant_id, temperature: body.temperature });
    return reply.code(201).send(toRunResource(run));
  });

  app.get('/v1/threads/:thread_id/runs', async (req, reply) => {
    const { thread_id } = req.params as { thread_id: string };
    await deps.threads.requireThread(thread_id);
    const data = (await deps.runs.listRuns(thread_id)).map(toRunResource);
    return reply.send(toList(data));
  });

  app.get('/v1/threads/:thread_id/runs/:run_id', async (req, reply) => {
    const { thread_id, run_id } = req.params as { thread_id: string; run_id: string };
    const run = await deps.runs.requireRunInThread(thread_id, run_id);
    return reply.send(toRunResource(run));
  });
}



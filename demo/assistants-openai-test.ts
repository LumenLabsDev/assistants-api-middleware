import OpenAI from 'openai';

async function main() {
  const baseURL = (process.env.ASSISTANTS_API_URL ?? 'http://localhost:3500') + '/v1';
  const apiKey = process.env.OPENAI_API_KEY ?? 'local-demo';

  const client = new OpenAI({ apiKey, baseURL });

  console.log(`Using Assistants API at ${baseURL}`);

  // 1) Create an assistant
  const assistant = await client.beta.assistants.create({
    name: 'Local Demo Assistant',
    model: 'gpt-4o',
    instructions: 'Reply concisely with a short answer.'
  });
  console.log('Assistant created:', assistant.id);

  // 2) Create a thread
  const thread = await client.beta.threads.create();
  console.log('Thread created:', thread.id);

  // 3) Add a user message
  await client.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: 'Say hello in one word.'
  });
  console.log('User message added');

  // 4) Create a run
  const run = await client.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
    temperature: 0.2
  });
  console.log('Run created:', run.id, 'status:', run.status);

  // 5) Retrieve run (optional; middleware returns final state immediately)
  const got = await client.beta.threads.runs.retrieve(run.id, { thread_id: thread.id } as any);
  console.log('Run retrieved:', got.id, 'status:', got.status);

  // 6) List messages and print the latest assistant reply
  const messages = await client.beta.threads.messages.list(thread.id);
  const data = messages.data ?? [];
  const lastAssistant = [...data].reverse().find(m => (m as any).role === 'assistant');
  const text = (lastAssistant as any)?.content?.[0]?.text?.value ?? '';
  console.log('\nAssistant reply:\n', text);
}

main().catch((err: any) => {
  const status = err?.status;
  const code = err?.code;
  const type = err?.type;
  const error = err?.error || err?.message;
  const headers = err?.headers;
  console.error('Demo failed:', { status, code, type, error, headers });
  process.exit(1);
});

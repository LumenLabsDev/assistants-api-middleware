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

  // 1a) List assistants
  const assistantsList = await client.beta.assistants.list();
  console.log('Assistants count:', assistantsList.data?.length ?? 0);

  // 1b) Get assistant
  const gotAssistant = await client.beta.assistants.retrieve(assistant.id);
  console.log('Assistant retrieved name:', gotAssistant.name);

  // 1c) Update assistant
  const updatedAssistant = await client.beta.assistants.update(assistant.id, { name: 'Local Demo Assistant v2' } as any);
  console.log('Assistant updated name:', updatedAssistant.name);

  // 2) Create a thread
  const thread = await client.beta.threads.create();
  console.log('Thread created:', thread.id);

  // 3) Add user/system messages
  await client.beta.threads.messages.create(thread.id, { role: 'user', content: 'Say hello in one word.' });
  await client.beta.threads.messages.create(thread.id, { role: 'system', content: 'Keep responses short.' } as any);
  await client.beta.threads.messages.create(thread.id, { role: 'user', content: 'What is 2+2?' });
  console.log('Messages added');

  // 4) Create first run
  const run1 = await client.beta.threads.runs.create(thread.id, { assistant_id: assistant.id, temperature: 0.2 });
  console.log('Run1 created:', run1.id, 'status:', run1.status);

  // 4a) Retrieve run1
  const got1 = await client.beta.threads.runs.retrieve(run1.id, { thread_id: thread.id } as any);
  console.log('Run1 retrieved status:', got1.status);

  // 5) Create second run
  const run2 = await client.beta.threads.runs.create(thread.id, { assistant_id: assistant.id });
  console.log('Run2 created:', run2.id, 'status:', run2.status);

  // 5a) List runs
  const runsList = await client.beta.threads.runs.list(thread.id);
  console.log('Runs count:', runsList.data?.length ?? 0);

  // 6) List messages and print the latest assistant reply
  const messages = await client.beta.threads.messages.list(thread.id);
  const data = messages.data ?? [];
  const lastAssistant = [...data].reverse().find(m => (m as any).role === 'assistant');
  const text = (lastAssistant as any)?.content?.[0]?.text?.value ?? '';
  console.log('\nAssistant reply:\n', text);

  // 7) Error paths
  try {
    await client.beta.assistants.retrieve('asst_missing');
  } catch (err: any) {
    console.log('Expected 404 retrieving missing assistant:', err?.status || err?.code || 'error');
  }
  try {
    await client.beta.threads.runs.create(thread.id, { } as any);
  } catch (err: any) {
    console.log('Expected 400 creating run without assistant_id:', err?.status || err?.code || 'error');
  }
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

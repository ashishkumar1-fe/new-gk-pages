import { useEffect, useRef, useState } from 'react';
import { useUi } from '@/store/ui';
import { AryaMark, ChatMessage, Composer, SidePanel } from '@/ui';
import { useAssistant } from '@/machines/assistant';
import { writeTools, readTools } from '@/assistant/tools';

type Msg = { id: string; role: 'user' | 'arya'; text: string };
let n = 0;

/**
 * Arya panel (design: arya.tsx AryaPanel). The machine owns the turn; this surface shows messages and the composer.
 * Until the model is connected, replies describe what Arya can do here, built from the command and resource cards.
 */
export const AssistantPanel = () => {
  const ui = useUi();
  const machine = useAssistant();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  const send = (text: string) => {
    setMsgs((m) => [...m, { id: `m${n++}`, role: 'user', text }]);
    machine.send({ type: 'MESSAGE' });
    setThinking(true);
    setTimeout(() => {
      const w = writeTools();
      const r = readTools();
      const reply = `I'm not connected to a model yet. When I am, I can read ${r.length} kinds of records and run ${w.length} actions here, each one going through the same path as a button press, with your approval before anything changes.`;
      setMsgs((m) => [...m, { id: `m${n++}`, role: 'arya', text: reply }]);
      setThinking(false);
      machine.send({ type: 'ANSWER' });
    }, 600);
  };
  useEffect(() => {
    if (!ui.assistantOpen) return;
    const p = ui.takePrompt();
    if (p) send(p);
  }, [ui.assistantOpen, ui.assistantPrompt]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' });
  }, [msgs.length, thinking]);

  return (
    <SidePanel
      open={ui.assistantOpen}
      onClose={() => ui.setAssistant(false)}
      title={
        <>
          <AryaMark />
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-a-ink-900">Arya</span>
            <span className="block truncate text-xs text-a-ink-450">Answers, actions and filters</span>
          </span>
        </>
      }
      footer={
        <Composer
          onSend={send}
          placeholder="Ask Arya anything"
          quick={['Give me my daily brief', 'Show draft products', 'What is running low on stock?']}
          disabled={thinking}
        />
      }
    >
      <div className="flex flex-col gap-4">
        {msgs.length === 0 && (
          <ChatMessage role="arya">Hi! Ask me about your products, or tell me what to do. I propose, you approve.</ChatMessage>
        )}
        {msgs.map((m) => (
          <ChatMessage key={m.id} role={m.role}>
            {m.text}
          </ChatMessage>
        ))}
        {thinking && (
          <ChatMessage role="arya">
            <span className="text-a-ink-450">Thinking…</span>
          </ChatMessage>
        )}
        <div ref={end} />
      </div>
    </SidePanel>
  );
};

import { runCommand } from '@/commands/runCommand';
import type { CommandContext, CommandId } from '@/commands/define';
import { Button, Card } from '@/ui';

/** The assistant proposes; the person approves. Approval is the confirm: runCommand(…, { surface: 'assistant', confirmed: true }). */
export const ProposalCard = ({
  command,
  input,
  ctx,
}: {
  command: CommandId;
  input: Record<string, unknown>;
  ctx: Omit<CommandContext, 'surface' | 'confirmed'>;
}) => (
  <Card title={`Proposed: ${command}`}>
    <pre className="mb-3 text-xs">{JSON.stringify(input, null, 2)}</pre>
    <Button variant="primary" onClick={() => void runCommand(command, input, { ...ctx, surface: 'assistant', confirmed: true })}>
      Approve
    </Button>
  </Card>
);

import { useLogin } from '@/machines/login';
import { Card, PageLayout } from '@/ui';

/** /login: credentials, code, unverified email, password change. Calls platform/session, the one write path outside commands. */
export const LoginPage = () => {
  const m = useLogin();
  return (
    <PageLayout>
      <Card title="Sign in">
        <p className="text-sm text-muted">Login machine state: {m.state}.</p>
      </Card>
    </PageLayout>
  );
};

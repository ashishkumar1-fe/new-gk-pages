import { useEffect, useRef, useState } from 'react';
import { useLogin } from '@/machines/login';
import { Button, Field, Logo, PageLoader, TextField } from '@/ui';
import { useGo } from '../_hooks/useGo';

type Step = 'creds' | 'otp' | 'loading';

/**
 * /login (design: admin/login/page.tsx): credentials → 6-digit code → store loader. The login machine owns the real
 * flow once platform/session's signIn, sendOtp and verifyOtp are ported; this surface drives the same states.
 */
export const LoginPage = () => {
  const go = useGo();
  const m = useLogin();
  const [step, setStep] = useState<Step>('creds');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const finish = () => {
    setStep('loading');
    m.send({ type: 'OK' });
    setTimeout(() => go('/'), 1800);
  };
  if (step === 'loading') return <PageLoader fullscreen />;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-18 items-center justify-between px-6">
        <Logo size="md" />
        <span className="text-sm text-a-ink-500">Admin</span>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-login animate-up">
          {step === 'creds' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address');
                if (pw.length < 6) return setErr('Password must be at least 6 characters');
                setErr(null);
                m.send({ type: 'SUBMIT' });
                setStep('otp');
              }}
              className="flex flex-col gap-4"
            >
              <div>
                <h1 className="text-3xl font-semibold text-a-ink-900">Sign in</h1>
                <p className="mt-1 text-a-ink-600">Manage products, orders and customers</p>
              </div>
              <Field label="Email" htmlFor="em">
                <TextField
                  id="em"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                />
              </Field>
              <Field
                label="Password"
                htmlFor="pw"
                right={
                  <button type="button" className="text-xs text-a-blue hover:underline">
                    Forgot password
                  </button>
                }
              >
                <div className="relative">
                  <TextField
                    id="pw"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-a-ink-600"
                  >
                    {show ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
              {err && (
                <p role="alert" className="text-sm text-a-danger">
                  {err}
                </p>
              )}
              <Button type="submit" variant="primary" size="md" block>
                Continue
              </Button>
              <div className="flex items-center gap-3 text-xs text-a-ink-450">
                <span className="h-px flex-1 bg-a-line-100" /> or <span className="h-px flex-1 bg-a-line-100" />
              </div>
              <Button size="md" block onClick={finish}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                  <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2Z" />
                  <path
                    fill="#34A853"
                    d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.7H2v2.9A11 11 0 0 0 12 23Z"
                  />
                  <path fill="#FBBC05" d="M5.7 13.9a6.6 6.6 0 0 1 0-4.2V6.8H2a11 11 0 0 0 0 9.9l3.7-2.8Z" />
                  <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.3 1.7l3.2-3.2A11 11 0 0 0 2 6.8l3.7 2.9C6.6 7.3 9.1 5.4 12 5.4Z" />
                </svg>
                Continue with Google
              </Button>
              <p className="text-center text-sm text-a-ink-500">
                New to Ratio? <span className="font-medium text-a-blue">Build your store</span>
              </p>
            </form>
          ) : (
            <Otp email={email} onBack={() => setStep('creds')} onDone={finish} />
          )}
        </div>
      </main>
      <footer className="flex justify-center gap-4 pb-6 text-sm text-a-ink-500">
        <span>Privacy</span>
        <span>Terms</span>
        <span>Help</span>
      </footer>
    </div>
  );
};

function Otp({ email, onBack, onDone }: { email: string; onBack: () => void; onDone: () => void }) {
  const [cells, setCells] = useState<string[]>(Array(6).fill(''));
  const [left, setLeft] = useState(30);
  const [err, setErr] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => {
    refs.current[0]?.focus();
  }, []);
  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const submit = (code: string) => (/^\d{6}$/.test(code) ? onDone() : setErr(true));
  const set = (i: number, v: string) => {
    const digits = v.replace(/\D/g, '');
    if (!digits && v) return;
    const next = [...cells];
    if (digits.length > 1)
      digits
        .slice(0, 6 - i)
        .split('')
        .forEach((c, k) => (next[i + k] = c));
    else next[i] = digits;
    setCells(next);
    setErr(false);
    const focus = Math.min(5, i + Math.max(1, digits.length));
    if (digits) refs.current[focus]?.focus();
    if (next.every(Boolean)) submit(next.join(''));
  };
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-3xl font-semibold text-a-ink-900">Check your email</h1>
        <p className="mt-1 text-a-ink-600">
          We sent a 6-digit code to <span className="font-medium text-a-ink-800">{email}</span>
        </p>
      </div>
      <div className="flex gap-2" role="group" aria-label="Verification code">
        {cells.map((c, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={c}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1}`}
            onChange={(e) => set(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !c && i > 0) refs.current[i - 1]?.focus();
            }}
            className={`a-ring h-12 w-full min-w-0 rounded text-center text-xl font-semibold text-a-ink-900 outline-none ${err ? 'shadow-ring-critical' : ''}`}
          />
        ))}
      </div>
      {err && (
        <p role="alert" className="text-sm text-a-danger">
          That code didn&apos;t work. Try again.
        </p>
      )}
      <p className="text-xs text-a-ink-450">Demo: any 6 digits work.</p>
      <div className="flex items-center justify-between">
        <button type="button" onClick={onBack} className="text-base font-medium text-a-ink-600 hover:text-a-ink-900">
          ← Back
        </button>
        <button
          type="button"
          disabled={left > 0}
          onClick={() => setLeft(30)}
          className="text-base font-medium text-a-blue disabled:text-a-ink-450"
        >
          {left > 0 ? `Resend in ${left}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}

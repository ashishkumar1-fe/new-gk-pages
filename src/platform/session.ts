import { request } from '@/platform/http/client';
import { BASE } from '@/platform/config';
import { notImplemented } from '@/lib/notImplemented';

/** Login, OTP, logout and store switch are the only writes outside commands (ADR 0001 exception). Shapes: docs/architecture/gateway/dashboard.md */
export interface UserDetails {
  user_details: {
    email: string;
    name?: string;
    is_internal_user: boolean;
    role: { permissions: string[] };
    allowed_merchants: { id: number; m_id: string; business_name: string }[];
  };
  merchant_details: { m_id: string; id?: number; business_name?: string };
  config: { selected_products?: Record<string, boolean> };
}

export const getUserDetails = (signal?: AbortSignal) =>
  request<{ data: UserDetails }>(`${BASE}/api/dashboard/user/details`, { signal }).then((r) => r.body.data);
export const signIn = (_email: string, _encryptedPassword: string) => notImplemented('POST /api/dashboard/user/signin');
export const sendOtp = (_email: string) => notImplemented('POST /api/dashboard/user/send-otp?isSignIn=true');
export const verifyOtp = (_otp: string, _email: string) => notImplemented('POST /api/dashboard/user/verify-otp');
export const googleSignIn = (_code: string) => notImplemented('GET /api/dashboard/user/google-signin?code=');
export const logout = () => request(`${BASE}/api/dashboard/user/logout`).then(() => undefined);
export const switchMerchant = (merchantNumericId: number) =>
  request(`${BASE}/api/dashboard/team/switch-merchant`, { method: 'POST', body: { merchant_id: merchantNumericId } });

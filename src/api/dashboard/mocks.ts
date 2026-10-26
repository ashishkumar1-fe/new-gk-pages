import { http, HttpResponse } from 'msw';
import userDetails from './fixtures/user-details.json';

/** MSW handlers for dashboard, served from fixtures/. */
export const dashboardHandlers = [http.get('*/api/dashboard/user/details', () => HttpResponse.json(userDetails))];

import { expect, request } from '@playwright/test';

export async function ApiGetRequest(url: string | '', api: string) {
  const apiContext = await request.newContext({ baseURL: url });
  const response = await apiContext.get(api);
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  return response.json();
}

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const API_VERSION = 'v60.0';

const alias = (): string => {
  const value = process.env.SF_ORG_ALIAS;
  if (!value) throw new Error('SF_ORG_ALIAS is missing in your .env file');
  return value;
};

// Runs an sf command and returns its result, ignoring any extra text the CLI prints
export const runSfJson = (command: string): any => {
  let output = '';
  try {
    output = execSync(`sf ${command} --json`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
    });
  } catch (error: any) {
    output = (error.stdout || '').toString();
    if (!output) {
      throw new Error(`sf command failed: ${error.stderr || error.message}`);
    }
  }

  // Remove color codes, then find the real JSON: a "{" followed by "status"
  const clean = output.replace(/\u001b\[[0-9;]*m/g, '');
  const match = clean.match(/\{\s*"status"/);
  if (!match || match.index === undefined) {
    throw new Error(`sf did not return JSON. Output was: ${clean}`);
  }
  const end = clean.lastIndexOf('}');
  let parsed: any;
  try {
    parsed = JSON.parse(clean.slice(match.index, end + 1));
  } catch {
    throw new Error(`Could not read sf output. Output was: ${clean}`);
  }
  if (parsed.status !== 0) {
    throw new Error(`sf command failed: ${parsed.message || clean}`);
  }
  return parsed.result;
};

// Access token and instance URL for the org (fetched once per run)
let cachedOrg: { accessToken: string; instanceUrl: string } | undefined;
export const getOrgInfo = () => {
  if (!cachedOrg) {
    const result = runSfJson(`org display --target-org ${alias()}`);
    cachedOrg = {
      accessToken: result.accessToken,
      instanceUrl: result.instanceUrl,
    };
  }
  return cachedOrg;
};

// Turns https://xxx.my.salesforce.com into https://xxx.lightning.force.com
export const toLightningUrl = (instanceUrl: string): string =>
  instanceUrl.replace('.my.salesforce.com', '.lightning.force.com');

// Full URL for a Lightning page, for example appUrl('/lightning/o/Account/list')
export const appUrl = (path: string): string => {
  const base = fs.readFileSync('auth/base-url.txt', 'utf-8').trim();
  return `${base}${path}`;
};

const callApi = async (method: string, path: string, body?: object) => {
  const { accessToken, instanceUrl } = getOrgInfo();
  const response = await fetch(
    `${instanceUrl}/services/data/${API_VERSION}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    }
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Salesforce API ${method} ${path} failed: ${text}`);
  }
  return text ? JSON.parse(text) : {};
};

// Create a record. Example: createRecord('Account', { Name: 'Test' })
export const createRecord = async (
  sobject: string,
  fields: Record<string, unknown>
): Promise<string> => {
  const result = await callApi('POST', `/sobjects/${sobject}`, fields);
  return result.id as string;
};

// Delete a record. Safe to call in cleanup.
export const deleteRecord = async (
  sobject: string,
  recordId: string
): Promise<void> => {
  try {
    await callApi('DELETE', `/sobjects/${sobject}/${recordId}`);
  } catch {
    console.warn(`Could not delete ${sobject} ${recordId}`);
  }
};

// Find a record Id by its Name
export const findRecordIdByName = async (
  sobject: string,
  name: string
): Promise<string | undefined> => {
  const safeName = name.replace(/'/g, "\\'");
  const soql = `SELECT Id FROM ${sobject} WHERE Name = '${safeName}' LIMIT 1`;
  const result = await callApi('GET', `/query?q=${encodeURIComponent(soql)}`);
  return result.records.length ? (result.records[0].Id as string) : undefined;
};
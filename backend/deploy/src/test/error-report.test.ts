import { getFunctionURLFromEnv } from "./common";
import { FunctionName } from "../deploy/gcf";
import admin from "firebase-admin";
import { ResourceName, ErrorReportClient, ErrorContext } from "@orca.ai/pulse";
import { makeTransmittableErrorFrom } from "@orca.ai/pulse/lib/error-report/types";

let errorClient = new ErrorReportClient(getFunctionURLFromEnv(FunctionName.errorReport));
const testDocIds: string[] = [];
beforeEach(async () => {
  admin.initializeApp();
  const errorReportURL = getFunctionURLFromEnv(FunctionName.errorReport);
  if (!errorReportURL) {
    throw new Error(`errorURL is null`);
  }
  errorClient = new ErrorReportClient(errorReportURL);
});
afterEach(async () => {
  const db = admin.firestore();
  const batch = db.batch();
  const deleteRefs = testDocIds.map(likeId => db.collection(ResourceName.ErrorReports).doc(likeId));
  deleteRefs.forEach(deleteRef => batch.delete(deleteRef));
  await batch.commit();
});

describe('Error Report API Test', () => {
  it('Error Report Test', async () => {
    await errorClient.ping();
    const testError = new Error("test error");
    const ctx: ErrorContext = {
      stack: "test stack",
      name: "test name",
      someNumericValue: 123,
      today: new Date().toISOString(),
    };
    console.debug(`Test script: sending testError: ${JSON.stringify(testError)}`);
    const reported = await errorClient.reportError(testError, ctx);
    console.debug(`reported: ${JSON.stringify(reported)}`);
    expect(reported).not.toBeNull();
    expect(reported.id).not.toBeNull();
    expect(reported.createdAt).not.toBeNull();
    expect(reported.error).toStrictEqual(makeTransmittableErrorFrom(testError));
    expect(reported.context).not.toBeNull();
    expect(reported.context!.stack).toBe(ctx.stack);
    expect(reported.context!.name).toBe(ctx.name);
    expect(reported.context!.someNumericValue).toBe(ctx.someNumericValue);
    expect(reported.context!.today).toBe(ctx.today);
  }, 1 * 60 * 1000);
});
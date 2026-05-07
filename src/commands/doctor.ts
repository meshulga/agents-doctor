import { runCheck, type CheckIssue } from "./check.js";
import { runLint } from "../lint/index.js";
import { loadSot } from "../sot/loader.js";
import { classify, type BucketMap } from "../doctor/classify.js";
import { writeTodo } from "../doctor/todo.js";

export interface DoctorOptions {
  projectRoot: string;
}

export interface DoctorResult {
  buckets: BucketMap;
  todoPath: string;
  driftIssues: CheckIssue[];
}

export async function runDoctor(opts: DoctorOptions): Promise<DoctorResult> {
  const sot = loadSot(opts.projectRoot);
  const driftResult = await runCheck({ projectRoot: opts.projectRoot });
  const lintIssues = runLint(sot, { projectRoot: opts.projectRoot });
  const buckets = classify(driftResult.issues, lintIssues);
  const todoPath = writeTodo(buckets, opts.projectRoot);
  return { buckets, todoPath, driftIssues: driftResult.issues };
}

import * as fs from 'fs';
import { runCommand } from './run-command';

export enum Phase {
  dev = 'dev',
  prod = 'prod',
}

export interface PhaseArgs {
  phase: Phase;
}

export enum Project {
  dev = 'chatbot-dev-406508',
  prod = 'chatbot-32ff4',
}

export enum Region {
  iowa = 'us-central1',
  tokyo = 'asia-northeast1',
  osaka = 'asia-northeast2',
  seoul = 'asia-northeast3',
}

export enum FunctionName {
  chat = 'chat',
  // crawler = 'crawler',
  hysuCrawler = 'hysuCrawler',
  chroma = 'chroma',
  like = 'like',
  errorReport = 'errorReport',
  // prompt = 'prompt',
  textify = 'textify',
}

export enum VPCConnector {
  dev = 'projects/chatbot-dev-406508/locations/us-central1/connectors/chroma-connector',
  prod = 'projects/chatbot-32ff4/locations/us-central1/connectors/chroma-connector',
}

export interface Arguments {
  project: Project;
  functionName: FunctionName;
  region: Region | null;
  memory: string | null;
  vpcConnector: VPCConnector | null;
  timeout: string | null;
  help: boolean | null;
  source: string;
}

/**
 * Removes using following sed pattern:
 * sed -i.bak "/lib\/\*\*\/\*.js/d" ../chroma/.gitignore
 * @param sourceDir 
 * @return Promise<void>
 */
async function excludeLibFromGitignore(sourceDir: string): Promise<void> {
  const args = [
    "-i.bak",
    "/lib\\/\\*\\*\\/\\*.js/d",
    `${sourceDir}/.gitignore`,
  ];
  await runCommand("sed", args);
}

/**
 * Restores .gitignore from .gitignore.bak
 * @param sourceDir 
 * @return Promise<void>
 */
async function recoverGitignoreFromBakFile(sourceDir: string): Promise<void> {
  const args = [
    `${sourceDir}/.gitignore.bak`,
    `${sourceDir}/.gitignore`,
  ];
  await runCommand("mv", args);
}

/**
 * Creates .npmrc file and writes following content:
 * //registry.npmjs.org/:_authToken=${NPM_TOKEN}
 * @param sourceDir 
 * @return Promise<void>
 */
async function createNpmrc(sourceDir: string): Promise<void> {
  const npmrcFile = `${sourceDir}/.npmrc`;
  fs.writeFileSync(npmrcFile, "",{flag: 'w'});
  const secretNpmToken = process.env.NPM_TOKEN;
  if (!secretNpmToken) {
    throw new Error('NPM_TOKEN is not set, aborting.');
  } else {
    console.debug(`Fetched NPM_TOKEN=${secretNpmToken.slice(0, 5)}...${secretNpmToken.slice(-5)}`)
  }
  const lines = [
    `//registry.npmjs.org/:_authToken=${secretNpmToken}`,
  ]
  try {
    for (const line of lines) {
      fs.appendFileSync(npmrcFile, `${line}\n`);
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Deletes .npmrc file for security reason
 * @param sourceDir
 * @returns Promise<void>
 */
async function deleteNpmrc(sourceDir: string): Promise<void> {
  const npmrcFile = `${sourceDir}/.npmrc`;
  fs.unlinkSync(npmrcFile);
}

export async function deploy(argv: Arguments) : Promise<void> {
  if (argv.help) {
    console.log(argv);
    return;
  }
  argv.project ??= Project.dev;
  argv.region ??= Region.iowa;
  argv.memory ??= '256MB';
  argv.timeout ??= '60s';

  console.log(`Excluding lib/**/*.js from ${argv.source}/.gitignore...`);
  try {
    await excludeLibFromGitignore(argv.source);
    console.log("Done.");
  } catch (err) {
    console.log('Failed to exclude lib/**/*.js from .gitignore.bak');
    console.error(`Failed to exclude lib/**/*.js from ${argv.source}/.gitignore`);
    throw err;
  }
  console.log(`Creating ${argv.source}/.npmrc...`);
  try {
    await createNpmrc(argv.source);
    console.log("Done.");
  } catch (err) {
    console.error(`Failed to create ${argv.source}/.npmrc, error: ${err}`);
    throw err;
  }
  console.log(`Deploying ${argv.functionName} to ${argv.project}...`);
  const npmTokenCommand = "$(gcloud secrets versions access latest --secret=\"orca-npm-token\" --format=\"get(payload.data)\" | base64 --decode)";
  const phase = (() => {
    switch (argv.project) {
      case Project.dev:
        return Phase.dev;
      case Project.prod:
        return Phase.prod;
      default:
        throw new Error(`Unexpected project: ${argv.project}`);
    }
  })();


  const args = [
    "functions",
    "deploy",
    argv.functionName,
    "--project",
    argv.project,
    "--region",
    argv.region,
    "--memory",
    argv.memory,
    "--timeout",
    argv.timeout,
    "--source",
    argv.source,
    "--runtime",
    "nodejs20",
    "--trigger-http",
    "--allow-unauthenticated",
    "--gen2",
    "--concurrency",
    "1",
    "--max-instances",
    "1",
    `--set-build-env-vars=NPM_TOKEN=${npmTokenCommand}`,
    `--set-env-vars=NPM_TOKEN=${npmTokenCommand},PHASE=${phase}`,
  ];
  if (argv.vpcConnector) {
    args.push("--vpc-connector", argv.vpcConnector);
  }
  try {
    const command = `gcloud ${args.join(" ")}`;
    console.log(`Running: ${command}`);
    await runCommand("gcloud", args);
  } catch (err) {
    console.error(err);
  } finally {
    console.log(`Recovering ${argv.source}/.gitignore from .gitignore.bak...`);
    try {
      await recoverGitignoreFromBakFile(argv.source);
    } catch (err) {
      console.error(err);
      throw err;
    }
    try {
      console.debug(`Deleting ${argv.source}/.npmrc...`);
      await deleteNpmrc(argv.source);
      console.log("Done.");
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
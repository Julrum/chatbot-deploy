import {spawn} from 'child_process';
import {promisify} from 'util';
import * as fs from 'fs';

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
  crawler = 'crawler',
  chroma = 'chroma',
  prompt = 'prompt',
}

export enum VPCConnector {
  dev = 'projects/chatbot-dev/locations/us-central1/connectors/chroma-connector',
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
  spawn("sed", args, {
    cwd: process.cwd(),
    // detached: true,
    stdio: 'inherit',
  });
}

/**
 * Restores .gitignore from .gitignore.bak
 * @param sourceDir 
 * @return Promise<void>
 */
async function recoverGitignoreFromBakFile(sourceDir: string): Promise<void> {
  const spawnAsync = promisify(spawn);
  const args = [
    `${sourceDir}/.gitignore.bak`,
    `${sourceDir}/.gitignore`,
  ];
  await spawnAsync("mv", args, {
    cwd: process.cwd(),
    detached: true,
    stdio: 'inherit',
  });
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
  const lines = [
    "//registry.npmjs.org/:_authToken=${NPM_TOKEN}"
  ]
  try {
    for (const line of lines) {
      fs.appendFileSync(npmrcFile, `${line}\n`);
    }
  } catch (error) {
    throw error;
  }
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
  const spawnAsync = promisify(spawn)
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
    "--set-secrets",
    `NPM_TOKEN=projects/${argv.project}/secrets/orca-npm-token/versions/latest`,
  ];
  if (argv.vpcConnector) {
    args.push("--vpc-connector", argv.vpcConnector);
  }
  try {
    const command = `gcloud ${args.join(" ")}`;
    console.log(`Running: ${command}`);
    await spawnAsync("gcloud", args, {
      cwd: process.cwd(),
      detached: true,
      stdio: 'inherit',
    });
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
  }
}
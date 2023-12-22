import {
  deploy, Project, Arguments, 
  FunctionName, Region,
  Phase, PhaseArgs,
} from "./gcf";
import Yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';


const devArgs: Arguments = {
  project: Project.dev,
  source: "../chat",
  functionName: FunctionName.chat,
  region: Region.iowa,
  memory: null,
  vpcConnector: null,
  timeout: "300s",
  help: null,
};

const prodArgs: Arguments = {
  project: Project.prod,
  source: "../chat",
  functionName: FunctionName.chat,
  region: Region.iowa,
  memory: null,
  vpcConnector: null,
  timeout: "300s",
  help: null,
};

const argv = Yargs(hideBin(process.argv))
  .option('phase', {
    alias: 'p',
    type: 'string',
    description: 'dev or prod',
  })
.argv as PhaseArgs;

console.debug(`argv: ${JSON.stringify(argv)}`);

const selectArgs = () => {
  switch (argv.phase) {
    case Phase.dev:
      return devArgs;
    case Phase.prod:
      return prodArgs;
    default:
      throw new Error(`Unexpected phase: ${argv.phase}`);
  }
};

const args = selectArgs();
console.debug(`args: ${JSON.stringify(args)}`);
deploy(args);

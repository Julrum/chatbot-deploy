import {
  deploy, Project, Arguments, 
  FunctionName, VPCConnector, Region,
  Phase, PhaseArgs,
} from "./gcf";
import Yargs from 'yargs/yargs';
import {hideBin} from 'yargs/helpers';


const devArgs: Arguments = {
  project: Project.dev,
  source: "../chroma",
  functionName: FunctionName.chroma,
  region: Region.iowa,
  memory: null,
  vpcConnector: VPCConnector.dev,
  timeout: null,
  help: null,
};

const prodArgs: Arguments = {
  project: Project.prod,
  source: "../chroma",
  functionName: FunctionName.chroma,
  region: Region.iowa,
  memory: null,
  vpcConnector: VPCConnector.prod,
  timeout: null,
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

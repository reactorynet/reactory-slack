import slackClis from './cli';
import slackResolvers from './resolvers';
import slackTypes from './graph/types';
import slackWorkflows from './workflow';
import slackForms from './forms';
import slackModels from './models';
import slackServices from './services';
import slackMacros from './ai/macros';
import Reactory from '@reactorynet/reactory-core';

const ReactorySlackModule: Reactory.Server.IReactoryModule = {
  id: 'reactory-slack',
  nameSpace: 'slack',
  version: '1.0.0',
  name: 'ReactorySlack',
  dependencies: [],
  priority: 0,
  graphDefinitions: {
    Resolvers: slackResolvers,
    Types: [...slackTypes],
  },
  workflows: [...slackWorkflows],
  forms: [...slackForms],
  services: [...slackServices],
  models: [...slackModels],
  cli: [...slackClis],
  description: 'Reactory Slack Module. Provides integration with the Slack REST API for messaging and channel interactions.',
  grpc: null,
  passportProviders: [],
  pdfs: [],
  middleware: [],
  routes: [],
  reactor: {
   macros: [...slackMacros],
  }
};

export default ReactorySlackModule;
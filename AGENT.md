# reactory-slack -- Server Module Agent Context

## What Is This Module

A comprehensive Slack integration module providing read/write/configuration services for Slack workspaces, with GraphQL resolvers, AI macros, forms, CLI tools, gRPC support, and OAuth authentication for both bot and user tokens.

- **Module ID**: `reactory-slack`
- **Namespace**: `slack`
- **FQN**: `slack.ReactorySlack@1.0.0`
- **Version**: `1.0.0`
- **Priority**: `0`

## Directory Structure

```
reactory-slack/
  index.ts                # ReactoryModuleDefinition entry point
  graph/
    types/                # GraphQL type definitions
  resolvers/              # GraphQL resolvers
  services/               # Slack API services
  models/                 # Data models
  forms/                  # UI form schemas
  routes/                 # Express routes (OAuth callbacks, webhooks)
  cli/                    # CLI commands
  middleware/             # Request middleware
  ai/
    macros/               # AI macro definitions for LLM-driven Slack operations
  schema/                 # Schema definitions
  types/                  # TypeScript type definitions
  workflow/               # Workflow definitions
  grpc/                   # gRPC/protobuf definitions
  passportProviders/      # Slack OAuth passport strategy
  pdf/                    # PDF generation templates
  data/                   # Static data
```

## Key Services

| Service | Purpose |
|---|---|
| `SlackReaderService` | Read messages, channels, threads, reactions |
| `SlackWriterService` | Send, update, delete messages; add/remove reactions |
| `SlackConfigurationService` | API configuration, connection testing, workspace info |

## Features

- Full Slack REST API coverage (messages, channels, threads, reactions)
- Bot token and user token authentication
- OAuth flow via passport providers
- AI macros for LLM-driven Slack automation
- gRPC support for inter-service communication
- GraphQL types and resolvers

## Environment Variables

```bash
SLACK_BOT_TOKEN          # Bot user OAuth token
SLACK_USER_TOKEN         # User OAuth token
SLACK_SIGNING_SECRET     # Request signing secret
SLACK_CLIENT_ID          # OAuth app client ID
SLACK_CLIENT_SECRET      # OAuth app client secret
```

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { CONFIG } from '../lib/config';

const app = new cdk.App();

new FrontendStack(app, CONFIG.naming.frontendStackName);

new BackendStack(app, CONFIG.naming.backendStackName);

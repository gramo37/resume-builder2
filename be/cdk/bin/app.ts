#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

new FrontendStack(app, 'FrontendStack');

new BackendStack(app, 'BackendStack');

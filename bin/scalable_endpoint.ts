#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ScalableEndpointStack } from '../lib/scalable_endpoint-stack';

const app = new cdk.App();
new ScalableEndpointStack(app, 'ScalableEndpointStack');

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { Stack, StackProps, aws_ecr as ecr, RemovalPolicy } from "aws-cdk-lib";
import { type Construct } from "constructs";
import { readAccountConfig } from "./../../config/types";

class ImageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const acctConfig = readAccountConfig("../../config/targets.yaml");

    for (const language of Object.keys(acctConfig)) {
      if (acctConfig[language].status === "enabled") {
        new ecr.Repository(this, `${language}-examples`, {
          repositoryName: `${language}`,
          imageScanOnPush: true,
          removalPolicy: RemovalPolicy.RETAIN,
        });
        // ADDED MANUALLY: Policy to allow cross-account image access.
        // While other resources policies in AWS either require or accept a resource section,
        // Cfn for ECR does not allow us to specify a resource policy. It will fail if a resource section is present at all.
        //
        // repository.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
        //   effect: cdk.aws_iam.Effect.ALLOW,
        //   principals: [new cdk.aws_iam.ArnPrincipal(`arn:aws:iam::${acctConfig[language].account_id}:role/BatchExecutionRole-${language}`)],
        //   actions: [
        //     "ecr:*"
        //   ],
        //   resources: [repository.repositoryArn]
        // }));
      }

    }
  }
}

const app = new cdk.App();

new ImageStack(app, "ImageStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: process.env.CDK_DEFAULT_REGION!,
  },
});

app.synth();

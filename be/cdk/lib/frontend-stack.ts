import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { CONFIG } from "./config";
import path from "path";

export class FrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const domainName = CONFIG.domain.frontendDomain;

    const certificate = new acm.Certificate(
      this,
      'FrontendCertificate',
      {
        domainName,
        validation: acm.CertificateValidation.fromDns(),
      },
    );

    // 1. Private S3 bucket
    const bucket = new s3.Bucket(this, "FrontendBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 2. CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "FrontendDistribution",
      {
        domainNames: [domainName],
        certificate,

        defaultRootObject: "index.html",

        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(
            bucket,
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy:
            cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },

        // React Router / SPA support
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.seconds(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.seconds(0),
          },
        ],
      }
    );

    // 4. Deploy the generated frontend files to S3.
    new s3deploy.BucketDeployment(
      this,
      'DeployFrontend',
      {
        sources: [
          s3deploy.Source.asset(
            path.resolve(
              __dirname,
              '../../../fe/dist',
            ),
          ),
        ],
        destinationBucket: bucket,
        distribution,
        distributionPaths: ['/*'],
        prune: true,
      },
    );

    // Output CloudFront URL
    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: bucket.bucketName,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'FrontendURL', {
      value: `https://${domainName}`,
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    });
  }
}
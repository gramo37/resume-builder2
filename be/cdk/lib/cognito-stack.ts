import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export class CognitoStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sesFromEmail = this.node.tryGetContext('sesFromEmail') as string | undefined;

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'applyant-users',
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: cdk.Duration.days(7),
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      mfa: cognito.Mfa.OFF,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
        emailSubject: 'Your Applyant verification code',
        emailBody: 'Your Applyant verification code is {####}.',
      },
      userInvitation: {
        emailSubject: 'Your Applyant account',
        emailBody: 'Your username is {username} and temporary password is {####}.',
      },
      email: sesFromEmail
        ? cognito.UserPoolEmail.withSES({
            fromEmail: sesFromEmail,
            fromName: 'Applyant',
            replyTo: sesFromEmail,
          })
        : cognito.UserPoolEmail.withCognito(),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient('ApiClient', {
      userPoolClientName: 'applyant-api',
      generateSecret: true,
      disableOAuth: true,
      authFlows: {
        adminUserPassword: true,
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      description: 'Set as COGNITO_USER_POOL_ID',
      value: this.userPool.userPoolId,
      exportName: 'ApplyantCognitoUserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      description: 'Set as COGNITO_CLIENT_ID',
      value: this.userPoolClient.userPoolClientId,
      exportName: 'ApplyantCognitoClientId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientSecret', {
      description: 'Set as COGNITO_CLIENT_SECRET',
      value: this.userPoolClient.userPoolClientSecret.unsafeUnwrap(),
    });

    new cdk.CfnOutput(this, 'Region', {
      description: 'Set as COGNITO_REGION and AWS_REGION',
      value: this.region,
      exportName: 'ApplyantCognitoRegion',
    });
  }
}

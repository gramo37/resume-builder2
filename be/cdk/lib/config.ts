const DB_HOST = process.env.DB_HOST || "";
const DB_PORT = process.env.DB_PORT || "";
const DB_NAME = "postgres";
const DB_USER = process.env.DB_USER || "";
const DB_PASSWORD = process.env.DB_PASSWORD || "";

const AWS_REGION = process.env.AWS_REGION || "us-east-1";

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "";
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || "";
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET || "";
const COGNITO_REGION = process.env.COGNITO_REGION || "us-east-1";

const BACKEND_IMAGE = "526955697352.dkr.ecr.us-east-1.amazonaws.com/resume-builder/backend:latest";

const FRONTEND_DOMAIN = "resume-builder.gramo37.in";
const BACKEND_DOMAIN = "resume-builder-api.gramo37.in";

export const CONFIG = {
    aws: {
        region: AWS_REGION,
        account: process.env.CDK_DEFAULT_ACCOUNT,
    },

    naming: {
        frontendStackName: "ResumeBuilderFrontendStack",
        backendStackName: "ResumeBuilderBackendStack",
        vpcName: "ResumeBuilderVpc",
        clusterName: "ResumeBuilderCluster",
        taskDefinitionName: "ResumeBuilderTask",
        serviceName: "ResumeBuilderService",
        loadBalancerName: "ResumeBuilderAlb",
        apiTargetGroupName: "ResumeBuilderApiTg",
        logGroupName: "/ecs/ResumeBuilder",
    },

    domain: {
        apiSubdomain: BACKEND_DOMAIN,
        frontendDomain: FRONTEND_DOMAIN,
    },

    networking: {
        maxAvailabilityZones: 2,
        natGateways: 0,
        assignPublicIp: true,
        albHttpPort: 80,
        albHttpsPort: 443,
    },

    service: {
        desiredCount: 1,
        minCapacity: 1,
        maxCapacity: 1,
        cpu: 256,
        memoryLimitMiB: 512,
        healthCheckGracePeriodSeconds: 90,
        albIdleTimeoutSeconds: 3600,
    },

    containers: {
        api: {
            name: "ResumeBuilderApi",
            image: BACKEND_IMAGE,
            port: 4000,
            healthCheckPath: "/health",
            environment: {
                NODE_ENV: "production",
                PORT: "4000",

                DB_HOST: DB_HOST,
                DB_PORT: DB_PORT,
                DB_NAME: DB_NAME,
                DB_USER: DB_USER,
                DB_PASSWORD: DB_PASSWORD,

                AWS_REGION: AWS_REGION,

                COGNITO_USER_POOL_ID: COGNITO_USER_POOL_ID,
                COGNITO_CLIENT_ID: COGNITO_CLIENT_ID,
                COGNITO_CLIENT_SECRET: COGNITO_CLIENT_SECRET,
                COGNITO_REGION: COGNITO_REGION,
            },
        },
    },

    routing: {
        apiPath: "/api/*",
        apiPriority: 10,
    },

    logs: {
        retentionDays: 7,
    },
}
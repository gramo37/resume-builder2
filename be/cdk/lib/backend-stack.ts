import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import { Construct } from "constructs";
import { AmiHardwareType } from "aws-cdk-lib/aws-ecs";

export class BackendStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    /*
     * ============================================================
     * ECR
     * ============================================================
     */

    const repository = new ecr.Repository(this, "BackendRepository", {
      repositoryName: "applyant-backend",

      lifecycleRules: [
        {
          maxImageCount: 5,
        },
      ],

      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    /*
     * ============================================================
     * VPC
     * ============================================================
     *
     * One AZ and no NAT Gateway to keep cost low.
     */

    const vpc = new ec2.Vpc(this, "BackendVpc", {
      maxAzs: 1,

      natGateways: 0,

      subnetConfiguration: [
        {
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    /*
     * ============================================================
     * SECURITY GROUP
     * ============================================================
     */

    const securityGroup = new ec2.SecurityGroup(
      this,
      "BackendSecurityGroup",
      {
        vpc,
        description: "Security group for Applyant ECS backend",
        allowAllOutbound: true,
      }
    );

    // Backend API
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(4000),
      "Allow backend API"
    );

    /*
     * ============================================================
     * ECS CLUSTER
     * ============================================================
     */

    const cluster = new ecs.Cluster(this, "BackendCluster", {
      vpc,
      clusterName: "applyant-backend-cluster",
    });

    /*
     * ============================================================
     * EC2 INSTANCE ROLE
     * ============================================================
     *
     * ECS EC2 instances need this role so that ECS can manage
     * containers and pull images from ECR.
     */

    const instanceRole = new iam.Role(this, "EcsInstanceRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),

      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonEC2ContainerServiceforEC2Role"
        ),

        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    });

    /*
     * ============================================================
     * ECS EC2 CAPACITY
     * ============================================================
     */

    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      "BackendAutoScalingGroup",
      {
        vpc,
    
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
    
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.MICRO
        ),
    
        machineImage: ecs.EcsOptimizedImage.amazonLinux2023(
          AmiHardwareType.ARM
        ),
    
        minCapacity: 1,
        desiredCapacity: 1,
        maxCapacity: 1,
    
        securityGroup,
    
        role: instanceRole,
    
        associatePublicIpAddress: true,
    
        blockDevices: [
          {
            deviceName: "/dev/xvda",
            volume: autoscaling.BlockDeviceVolume.ebs(20, {
              volumeType: autoscaling.EbsDeviceVolumeType.GP3,
              encrypted: true,
            }),
          },
        ],
      }
    );

    const capacityProvider = new ecs.AsgCapacityProvider(
      this,
      "BackendCapacityProvider",
      {
        autoScalingGroup,
      }
    );
    
    cluster.addAsgCapacityProvider(capacityProvider);

    /*
     * ============================================================
     * ALLOW ECS EC2 INSTANCE TO PULL FROM ECR
     * ============================================================
     */

    repository.grantPull(instanceRole);

    /*
     * ============================================================
     * TASK EXECUTION ROLE
     * ============================================================
     *
     * Used by ECS to:
     * - Pull the image from ECR
     * - Write logs to CloudWatch
     */

    const executionRole = new iam.Role(
      this,
      "BackendTaskExecutionRole",
      {
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),

        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            "service-role/AmazonECSTaskExecutionRolePolicy"
          ),
        ],
      }
    );

    /*
     * ============================================================
     * TASK ROLE
     * ============================================================
     *
     * This is the IAM role available INSIDE your Node.js
     * application.
     *
     * For example:
     * - S3
     * - Cognito
     * - other AWS APIs
     */

    const taskRole = new iam.Role(this, "BackendTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    /*
     * Example:
     *
     * taskRole.addToPolicy(
     *   new iam.PolicyStatement({
     *     actions: ["s3:GetObject", "s3:PutObject"],
     *     resources: ["arn:aws:s3:::your-bucket/*"],
     *   })
     * );
     */

    /*
     * ============================================================
     * ECS TASK DEFINITION
     * ============================================================
     */

    const taskDefinition = new ecs.Ec2TaskDefinition(
      this,
      "BackendTaskDefinition",
      {
        family: "applyant-backend",

        executionRole,
        taskRole,

        networkMode: ecs.NetworkMode.AWS_VPC,
      }
    );

    /*
     * ============================================================
     * CONTAINER
     * ============================================================
     *
     * IMPORTANT:
     *
     * We specify the repository but use a tag.
     *
     * GitHub Actions can push:
     *
     * applyant-backend:<git-sha>
     *
     * and then update the ECS task definition.
     */

    const container = taskDefinition.addContainer(
      "BackendContainer",
      {
        image: ecs.ContainerImage.fromEcrRepository(
          repository,
          "latest"
        ),

        cpu: 256,
        memoryLimitMiB: 512,

        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: "applyant-backend",
        }),

        environment: {
          NODE_ENV: "production",
          PORT: "4000",

          AWS_REGION: this.region,
          COGNITO_REGION: this.region,

          // Do NOT put passwords/secrets here.
          //
          // DB credentials and Cognito client secret should
          // eventually come from Secrets Manager.
        },

        healthCheck: {
          command: [
            "CMD-SHELL",
            "wget -q -O- http://localhost:4000/health || exit 1",
          ],
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          retries: 3,
          startPeriod: cdk.Duration.seconds(30),
        },
      }
    );

    container.addPortMappings({
      containerPort: 4000,
      hostPort: 4000,
      protocol: ecs.Protocol.TCP,
    });

    /*
     * ============================================================
     * ECS SERVICE
     * ============================================================
     */

    const service = new ecs.Ec2Service(this, "BackendService", {
      cluster,

      serviceName: "applyant-backend",

      taskDefinition,

      desiredCount: 1,

      minHealthyPercent: 0,
      maxHealthyPercent: 100,

      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },

      circuitBreaker: {
        rollback: true,
      },

      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    /*
     * ============================================================
     * OUTPUTS
     * ============================================================
     */

    new cdk.CfnOutput(this, "EcrRepositoryUri", {
      value: repository.repositoryUri,
    });

    new cdk.CfnOutput(this, "EcsClusterName", {
      value: cluster.clusterName,
    });

    new cdk.CfnOutput(this, "EcsServiceName", {
      value: service.serviceName,
    });

    new cdk.CfnOutput(this, "EcsTaskDefinition", {
      value: taskDefinition.taskDefinitionArn,
    });
  }
}
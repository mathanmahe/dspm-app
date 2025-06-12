## DSPM App Deployment Architecture

This architecture deploys a full-stack DSPM (Data Security Posture Management) app on AWS, fully serverless, decoupled, scalable, and cost-optimized.

---

## 1️⃣ Frontend (React App)

- **React static build** hosted on:
  - Amazon S3 (`dspm-app-storage/frontend/`)
  - Public access controlled via:
    - AWS CloudFront (Frontend Distribution)
    -  CloudFront domain: `https://d3r2bxpb2ww7u6.cloudfront.net`

- **Deployment flow:**
  ```bash
  npm run build
  aws s3 sync build/ s3://dspm-app-storage/frontend/ --delete
  aws cloudfront create-invalidation --distribution-id <frontend-dist-id> --paths "/*"

## 2️⃣ Backend API (FastAPI)
Deployed via AWS Copilot

Load Balanced Web Service (ECS Fargate) with:

ALB (Application Load Balancer)

Target group listens on port 8000

Exposed via internal ELB DNS

Public HTTPS access (final setup):

Via secondary CloudFront Distribution (API Distribution)

Origin set to ALB DNS (HTTP only from CloudFront → ALB)

CloudFront provides free managed HTTPS for the API

Environment variables: securely passed via Copilot

Permissions:

IAM Task Role attached to API service for:

s3:GetObject from S3 bucket (scan-results)

rds:Connect to PostgreSQL

## 3️⃣ Scanner Job (Data Scanner)
Deployed via Copilot Scheduled Job (Fargate)

Runs on daily schedule (@daily)

Responsibilities:

Connect to PostgreSQL database (RDS)

Scan for sensitive data using regex

Generate scan_results.json file

Upload results to:

s3://dspm-app-storage/scan-results/scan_results.json

IAM Role permissions:

s3:PutObject to bucket prefix scan-results/*

rds:Connect for database access

## 4️⃣ Database (PostgreSQL)
Hosted on Amazon RDS

 PostgreSQL engine

Accessible from backend services via private VPC networking

Secured with strong credentials (managed via environment variables)
# Setup detailed steps. 

1. first set up aws account
2. configure IAM user
3. Configure IAM Roles
4. Configure database RDS postgres
5. get default vpc id using this command:

```aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text
```


    vpc-03063a46b095a11af


6. create a security group 

aws ec2 create-security-group --group-name dspm-rds-sg --description "RDS access for Cloud DSPM" --vpc-id vpc-03063a46b095a11af


        {
            "GroupId": "sg-05c070f85d00570e3",
            "SecurityGroupArn": "arn:aws:ec2:us-west-1:694426722405:security-group/sg-05c070f85d00570e3"
        }

7. allow inbound access on port 5432

    aws ec2 authorize-security-group-ingress --group-id <security-group-id> --protocol tcp --port 5432 --cidr 0.0.0.0/0

using 0.0.0.0/0 opens port publicly for testing only. for production restrict cidr to your ip or ecs subnet. 



    aws ec2 authorize-security-group-ingress --group-id sg-05c070f85d00570e3 --protocol tcp --port 5432 --cidr 0.0.0.0/0

    {
        "Return": true,
        "SecurityGroupRules": [
            {
                "SecurityGroupRuleId": "sgr-05b654b961db04870",
                "GroupId": "sg-05c070f85d00570e3",
                "GroupOwnerId": "694426722405",
                "IsEgress": false,
                "IpProtocol": "tcp",
                "FromPort": 5432,
                "ToPort": 5432,
                "CidrIpv4": "0.0.0.0/0",
                "SecurityGroupRuleArn": "arn:aws:ec2:us-west-1:694426722405:security-group-rule/sgr-05b654b961db04870"
            }
        ]
    }


8. to find availability zones in our region:

    aws ec2 describe-availability-zones --region us-west-1 --query 'AvailabilityZones[].ZoneName' --output text

    us-west-1a      us-west-1b

the region we initially chose was `us-west-1`

9. Finally we configure the database using this command:


        aws rds create-db-instance \
            --db-instance-identifier cloud-dspm-db \
            --allocated-storage 20 \
            --db-instance-class db.t3.micro \
            --engine postgres \
            --master-username adminuser \
            --master-user-password dbpassword \
            --vpc-security-group-ids sg-05c070f85d00570e3 \
            --availability-zone us-west-1a \
            --port 5432 \
            --backup-retention-period 7 \
            --no-publicly-accessible \
            --storage-type gp2 \
            --engine-version 17.5

DB instance stuff output 

        {
            "DBInstance": {
                "DBInstanceIdentifier": "cloud-dspm-db",
                "DBInstanceClass": "db.t3.micro",
                "Engine": "postgres",
                "DBInstanceStatus": "creating",
                "MasterUsername": "adminuser",
                "AllocatedStorage": 20,
                "PreferredBackupWindow": "08:20-08:50",
                "BackupRetentionPeriod": 7,
                "DBSecurityGroups": [],
                "VpcSecurityGroups": [
                    {
                        "VpcSecurityGroupId": "sg-05c070f85d00570e3",
                        "Status": "active"
                    }
                ],
                "DBParameterGroups": [
                    {
                        "DBParameterGroupName": "default.postgres17",
                        "ParameterApplyStatus": "in-sync"
                    }
                ],
                "AvailabilityZone": "us-west-1a",
                "DBSubnetGroup": {
                    "DBSubnetGroupName": "default",
                    "DBSubnetGroupDescription": "default",
                    "VpcId": "vpc-03063a46b095a11af",
                    "SubnetGroupStatus": "Complete",
                    "Subnets": [
                        {
                            "SubnetIdentifier": "subnet-036ec27120963aecd",
                            "SubnetAvailabilityZone": {
                                "Name": "us-west-1a"
                            },
                            "SubnetOutpost": {},
                            "SubnetStatus": "Active"
                        },
                        {
                            "SubnetIdentifier": "subnet-0b335d1aa7d53f1b2",
                            "SubnetAvailabilityZone": {
                                "Name": "us-west-1b"
                            },
                            "SubnetOutpost": {},
                            "SubnetStatus": "Active"
                        }
                    ]
                },
                "PreferredMaintenanceWindow": "fri:12:45-fri:13:15",
                "PendingModifiedValues": {
                    "MasterUserPassword": "****"
                },
                "MultiAZ": false,
                "EngineVersion": "17.5",
                "AutoMinorVersionUpgrade": true,
                "AutoMinorVersionUpgrade": true,
                "ReadReplicaDBInstanceIdentifiers": [],
                "LicenseModel": "postgresql-license",
                "OptionGroupMemberships": [
                    {
                        "OptionGroupName": "default:postgres-17",
                        "Status": "in-sync"
                    }
                ],
                "PubliclyAccessible": false,
                "StorageType": "gp2",
                "DbInstancePort": 0,
                "StorageEncrypted": false,
                "DbiResourceId": "db-ALK77ELZS6NAXITJSUSDKOUEZY",
                "CACertificateIdentifier": "rds-ca-rsa2048-g1",
                "DomainMemberships": [],
                "CopyTagsToSnapshot": false,
                "MonitoringInterval": 0,
                "DBInstanceArn": "arn:aws:rds:us-west-1:694426722405:db:cloud-dspm-db",
                "IAMDatabaseAuthenticationEnabled": false,
                "DatabaseInsightsMode": "standard",
                "PerformanceInsightsEnabled": false,
                "DeletionProtection": false,
                "AssociatedRoles": [],
                "TagList": [],
                "CustomerOwnedIpEnabled": false,
                "BackupTarget": "region",
                "NetworkType": "IPV4",
                "StorageThroughput": 0,
                "CertificateDetails": {
                    "CAIdentifier": "rds-ca-rsa2048-g1"
                },
                "DedicatedLogVolume": false,
                "EngineLifecycleSupport": "open-source-rds-extended-support"
            }
        }



9. wait for the instance to become available. 

        aws rds wait db-instance-available --db-instance-identifier cloud-dspm-db

10. Get the endpoint to connect

        aws rds describe-db-instances --db-instance-identifier cloud-dspm-db --query 'DBInstances[0].Endpoint.Address' --output text

        cloud-dspm-db.c3qayc8aagwb.us-west-1.rds.amazonaws.com

11. Connect to the DB

        psql --host=cloud-dspm-db.c3qayc8aagwb.us-west-1.rds.amazonaws.com --port=5432 --username=adminuser --password --dbname=postgres

Once connected we will get this response. 

        Password: 
        psql (14.13 (Homebrew), server 17.5)


12.Then create Dockerfile, and write the backend adn test it. 
13. deploy it using copilot

        brew install aws/tap/copilot-cli

14. intiialize copilot

        copilot --init

        Application name : dspm-app
        Service type : Backend Service
        Service name : scanner
        Dockerfile Location : deploy/Dockerfile

15. add environment variables - ```copilot/scanner/manifest.yml```

        environment_variables:
        DB_HOST: 'cloud-dspm-db.c3qayc8aagwb.us-west-1.rds.amazonaws.com'
        DB_NAME: 'postgres'
        DB_USER: 'adminuser'
        DB_PASSWORD: 'dbpassword'
        DB_PORT: '5432'


16. Init scanner as a job:

        <!-- copilot env deploy --name dev -->
        copilot job init --name scanner-job --dockerfile ./scanner/Dockerfile --schedule "@daily"


17. Host job on fargate

    deploy:

        copilot job deploy --name scanner-job --env dev

    run:

        copilot job run --name scanner-job --env dev 

    view logs:

        copilot job logs --name scanner-job --env dev

    to delete:

        copilot job delete --name scanner-job --env dev



18. Init backend api 
        copilot svc init --name api --svc-type 'Load Balanced Web Service' --dockerfile ./backend/Dockerfile


19. Deploy backend api
        copilot svc deploy --name api --env dev

        copilot svc status --name api --env dev

        copilot svc deploy --name api --env dev --no-rollback

20. Access backend API
        copilot svc show --name api --env dev

21. Building front end
# DSPM Frontend Deployment Guide (React + S3 + CloudFront)


---

## 1. Build the React frontend

Inside your local frontend app repo:

        npm install
        npm run build


This creates a `build/` directory containing production assets.

---

## 2. Upload build to S3 bucket

(Replace `dspm-app-storage` with your actual bucket name if different)

        aws s3 sync build/ s3://dspm-app-storage/frontend/ --delete

The `frontend/` folder inside your bucket holds your build files.

`--delete` ensures removed files get deleted from S3 to keep in sync.

---

## 3. CloudFront Distribution Setup (already done)

Your CloudFront distribution ID:
        E3FGBJ616L3CIU


Distribution Domain Name:
        https://d3r2bxpb2ww7u6.cloudfront.net/



This CloudFront distribution is already configured to serve files from your S3 bucket.

---

## 4. Ensure correct CloudFront Origin (double check)

Go to AWS → CloudFront → Origins

Confirm origin is:

- S3 Bucket: `dspm-app-storage`
- Origin path (optional): `/frontend`

Confirm behaviors:

- Viewer protocol: Redirect HTTP to HTTPS
- Cache policy: Managed-CachingOptimized

---

## 5. Optional: Invalidate CloudFront cache (for future redeployments)

After every re-deployment you may want to clear cache:

aws cloudfront create-invalidation
--distribution-id E3FGBJ616L3CIU
--paths "/*"


## 6. Access your deployed app

Visit:
        https://d3r2bxpb2ww7u6.cloudfront.net/
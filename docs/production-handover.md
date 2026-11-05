# Production Handover

Use this short checklist when handing Kaindra production operations to a
team or owner. Do not treat an EC2 instance being created as proof that the
service is ready for production.

## What is deployed

Terraform provisions one EC2 instance, networking, ECR repositories, IAM
access, and a Secrets Manager secret name. GitHub Actions builds and deploys
the frontend and backend images to that instance through AWS Systems Manager.
Caddy serves the site and routes API and real-time traffic.

MongoDB is **not** included in the AWS Terraform or deployment Compose setup.
It must be provided and operated separately. Terraform also does not configure
DNS, database backups, monitoring, alerting, or high availability.

## Handover checklist

- [ ] Name the production service owner and on-call/incident contact.
- [ ] Confirm the AWS account, region, approved operator access, and Terraform
  state bucket. Keep state, plans, credentials, and secret files protected.
- [ ] Confirm production GitHub Environment restrictions and required
  reviewers. Verify its environment-scoped variables and OIDC role.
- [ ] Confirm the EC2 `Environment` tag is `production`, the server is
  reachable through SSM, and approved HTTP/HTTPS ingress is configured.
- [ ] Point the approved production hostname to the instance Elastic IP and
  verify HTTPS certificate issuance and renewal.
- [ ] Provide a reachable MongoDB service; verify network access and store
  its connection string in the production Secrets Manager secret.
- [ ] Configure and test database backups and restores. Document retention
  and recovery-time/recovery-point objectives.
- [ ] Configure monitoring, alerting, log access, incident response, and
  recovery ownership for the application, host, and database.
- [ ] Verify a production deployment and test the website, key workflows,
  backend readiness, integrations, and database connectivity.
- [ ] Document how application secrets are rotated and how a failed release
  is investigated or rolled back.

Production deployment is blocked unless GitHub Actions has the required
environment variables and the production secret is populated. In particular,
`DATABASE_ROLLBACK_SAFE` must be exactly `true` only after confirming the
release's database changes are backward-compatible. Application image
rollback does not reverse database changes.

## Pending Production Integrations

### Shiprocket

**Status:** Implemented, awaiting production credentials.

The integration currently operates in mock mode.
The production team must configure Shiprocket credentials
in AWS Secrets Manager, configure the webhook, disable
mock mode, and complete real-shipment testing.

Refer to [Security and Secrets](./11-security-and-secrets.md#shiprocket-integration--production-handover)
for detailed instructions.

## Helpful references

- [Terraform and AWS deployment](../terraform/DEPLOYMENT.md)
- [Terraform state and security](../terraform/STATE-AND-SECURITY.md)
- [CI/CD deployment overview](./cicd-deployment.md)
- [Environment configuration](./environment-configuration.md)
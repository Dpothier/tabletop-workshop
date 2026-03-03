# Ralph in CI/CD Pipelines

Guide for integrating Ralph Wiggum autonomous TDD loop into CI/CD systems.

## GitHub Actions Example

Create `.github/workflows/ralph-autonomous-tdd.yml`:

```yaml
name: Ralph Autonomous TDD

on:
  schedule:
    # Run nightly at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch:  # Allow manual trigger

jobs:
  ralph-tdd:
    runs-on: ubuntu-latest
    container:
      image: node:22-alpine

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Configure Git
        run: |
          git config --global user.email "ralph@bot.local"
          git config --global user.name "Ralph Wiggum"

      - name: Run Ralph
        run: bash scripts/ralph/ralph.sh
        env:
          SKIP_COMMIT: 'false'
          DRY_RUN: 'false'

      - name: Push commits
        if: success()
        run: |
          git push origin main

      - name: Upload progress
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ralph-progress
          path: |
            progress.txt
            prd.json

      - name: Notify on completion
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const prd = JSON.parse(fs.readFileSync('prd.json', 'utf8'));
            const completed = prd.userStories.filter(s => s.passes).length;
            const total = prd.userStories.length;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `Ralph completed! Progress: ${completed}/${total} stories`
            });
```

## GitLab CI Example

Create `.gitlab-ci.yml` section:

```yaml
ralph-autonomous-tdd:
  stage: test
  image: node:22-alpine

  script:
    - npm ci
    - git config --global user.email "ralph@bot.local"
    - git config --global user.name "Ralph Wiggum"
    - bash scripts/ralph/ralph.sh

  artifacts:
    paths:
      - progress.txt
      - prd.json
    expire_in: 1 week

  only:
    - schedules  # Runs on schedule, or
    - triggers   # Can be triggered manually
```

## Jenkins Example

Create `Jenkinsfile`:

```groovy
pipeline {
  agent {
    docker {
      image 'node:22-alpine'
      args '--no-entrypoint'
    }
  }

  environment {
    SKIP_COMMIT = 'false'
    DRY_RUN = 'false'
  }

  triggers {
    // Nightly at 2 AM
    cron('0 2 * * *')
  }

  stages {
    stage('Setup') {
      steps {
        sh 'npm ci'
        sh 'git config --global user.email "ralph@bot.local"'
        sh 'git config --global user.name "Ralph Wiggum"'
      }
    }

    stage('Ralph TDD Loop') {
      steps {
        sh 'bash scripts/ralph/ralph.sh'
      }
    }

    stage('Push Results') {
      when {
        success()
      }
      steps {
        sh 'git push origin main'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'progress.txt,prd.json'
    }
    success {
      emailext(
        subject: "Ralph completed successfully",
        to: "team@example.com",
        body: "Progress: See artifacts"
      )
    }
    failure {
      emailext(
        subject: "Ralph encountered issues",
        to: "team@example.com",
        body: "Check logs and progress.txt"
      )
    }
  }
}
```

## Docker / Kubernetes

Ralph automatically detects container environment (checks for `/.dockerenv`) and switches to AFK mode with max 50 iterations.

### Dockerfile for Ralph

```dockerfile
FROM node:22-alpine

WORKDIR /workspace

COPY . .

RUN npm ci

# Configure git for commits
RUN git config --global user.email "ralph@bot.local" && \
    git config --global user.name "Ralph Wiggum"

# Make scripts executable
RUN chmod +x scripts/ralph/ralph.sh && \
    chmod +x scripts/ralph/jira-sync.sh && \
    chmod +x .ralph/config.sh

ENTRYPOINT ["bash", "scripts/ralph/ralph.sh"]
```

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: ralph-tdd
spec:
  schedule: "0 2 * * *"  # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: ralph-bot
          containers:
          - name: ralph
            image: your-registry/tabletop-workshop:ralph
            volumeMounts:
            - name: git-config
              mountPath: /home/node/.gitconfig
              subPath: gitconfig
          volumes:
          - name: git-config
            configMap:
              name: git-config
          restartPolicy: Never
```

## JIRA Integration in CI/CD

Combine Ralph with JIRA sync for full workflow:

```bash
#!/bin/bash
set -e

# Pull latest stories from JIRA
export JIRA_BASE_URL="https://your-instance.atlassian.net"
export JIRA_EMAIL="$JIRA_EMAIL"
export JIRA_API_TOKEN="$JIRA_API_TOKEN"
export JIRA_PROJECT_KEY="TW"

bash scripts/ralph/jira-sync.sh pull

# Run Ralph TDD loop
bash scripts/ralph/ralph.sh

# Push completion status back to JIRA
bash scripts/ralph/jira-sync.sh push
```

Store credentials as:
- GitHub Secrets: `JIRA_EMAIL`, `JIRA_API_TOKEN`
- GitLab Variables: `JIRA_EMAIL`, `JIRA_API_TOKEN`
- Jenkins Credentials: Stored in Jenkins Credentials Manager

## Monitoring & Alerts

### Prometheus Metrics

Export from Ralph:

```bash
# Add to ralph.sh
cat > metrics.txt << EOF
# HELP ralph_stories_total Total number of stories
# TYPE ralph_stories_total gauge
ralph_stories_total{project="tabletop-workshop"} $TOTAL_STORIES

# HELP ralph_stories_completed Completed stories
# TYPE ralph_stories_completed gauge
ralph_stories_completed{project="tabletop-workshop"} $COMPLETED_STORIES

# HELP ralph_iterations Total iterations executed
# TYPE ralph_iterations_counter counter
ralph_iterations_counter{project="tabletop-workshop"} $ITERATION
EOF
```

### Slack Notifications

```bash
# Add to ralph.sh after completion
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"Ralph completed\",
    \"blocks\": [
      {
        \"type\": \"section\",
        \"text\": {
          \"type\": \"mrkdwn\",
          \"text\": \"*Progress*: $COMPLETED_STORIES/$TOTAL_STORIES\"
        }
      }
    ]
  }"
```

## Best Practices

1. **Secrets Management**
   - Never commit API tokens
   - Use CI/CD platform's secret management
   - Rotate tokens regularly

2. **Retry Logic**
   - Set reasonable max iterations (50 for AFK)
   - Let Ralph retry failed stories next run
   - Monitor failure patterns in progress.txt

3. **Notifications**
   - Alert on completion
   - Alert on repeated failures (3+ iterations)
   - Track progress trends

4. **Resource Constraints**
   - Docker: 2GB RAM recommended
   - Disk: 1GB for node_modules
   - Time: Plan 30-60 min per full cycle

5. **Git Configuration**
   - Use bot account for automated commits
   - Require code review for merged branches
   - Track commit history for auditing

6. **Testing Coverage**
   - Ensure tests cover story requirements
   - Run `npm run check` before commit
   - Validate prd.json before each run

## Troubleshooting CI/CD

### Ralph hangs in container
Check:
- Container has sufficient memory (`docker stats`)
- Network access to npm registry
- Tests have timeout configured

### Commits don't push
Verify:
- Git credentials configured
- Branch protections allow bot commits
- SSH key or token has push permission

### Stories not syncing with JIRA
Check:
- JIRA credentials are valid
- API token not expired
- User has permission to view stories
- Project key matches exactly

## Useful Commands

```bash
# Test Ralph locally (dry run)
DRY_RUN=true bash scripts/ralph/ralph.sh

# View progress without running
cat progress.txt | tail -50

# Validate prd.json
jq . prd.json

# Check story count
jq '.userStories | length' prd.json
```

## Support

For issues:
1. Check `progress.txt` for error details
2. Review logs from CI/CD platform
3. Run tests manually: `npm run test`
4. Validate configuration: `bash .ralph/config.sh`

# Commit Message Themes

This document describes the theme feature for customizing commit messages based on your project type.

## What is a Theme?

A theme provides context to Ollama about your project type, helping it generate more relevant and contextual commit messages. When enabled, the theme is added to the prompt sent to Ollama, guiding it to frame commit messages in that context.

## How to Set a Theme

### Option 1: Configuration File

Edit `config/config.yaml`:

```yaml
ollama:
  theme: "kubernetes"  # Set your theme here
```

### Option 2: Environment Variable

```bash
export OLLAMA_THEME="docker"
python3 main.py
```

Or in `.env` file:
```
OLLAMA_THEME=terraform
```

### Option 3: Docker Compose

```yaml
environment:
  - OLLAMA_THEME=microservices
```

## Available Themes

### Infrastructure & DevOps
- **kubernetes** - Kubernetes, pods, deployments, services, helm charts
- **docker** - Containers, images, Dockerfiles, compose
- **terraform** - Infrastructure as code, resources, modules
- **ansible** - Configuration management, playbooks, roles
- **aws** - AWS services, CloudFormation, Lambda
- **azure** - Azure resources, ARM templates
- **gcp** - Google Cloud Platform services

### Application Development
- **microservices** - Service architecture, APIs, messaging
- **api** - REST APIs, endpoints, GraphQL
- **frontend** - UI, components, React, Vue, Angular
- **backend** - Server-side logic, databases, business logic
- **mobile** - iOS, Android, React Native, Flutter

### Data & ML
- **data-pipeline** - ETL, data processing, workflows
- **machine-learning** - Models, training, inference
- **database** - Schema changes, migrations, queries

### Other
- **security** - Security fixes, vulnerabilities, auth
- **performance** - Optimization, caching, profiling
- **testing** - Test suites, coverage, e2e tests
- **documentation** - Docs, guides, examples

## Examples

### Without Theme
```
feat: update configuration file
fix: resolve API endpoint issue
chore: update dependencies
```

### With Kubernetes Theme
```yaml
theme: "kubernetes"
```
```
feat: add HorizontalPodAutoscaler for api deployment
fix: resolve pod scheduling issue in production cluster
chore: update helm chart values for resource limits
refactor: optimize liveness and readiness probes
```

### With Docker Theme
```yaml
theme: "docker"
```
```
feat: add multi-stage build to reduce image size
fix: resolve container startup race condition
chore: update base image to alpine 3.18
refactor: optimize layer caching in Dockerfile
```

### With API Theme
```yaml
theme: "api"
```
```
feat: add pagination support to user endpoints
fix: resolve rate limiting issue in authentication
docs: update OpenAPI specification for v2 endpoints
refactor: standardize error response format
```

## Custom Themes

You can use any theme string that makes sense for your project:

```yaml
theme: "e-commerce platform"
theme: "IoT sensor network"
theme: "CI/CD pipeline"
theme: "monitoring and observability"
```

The more specific and descriptive your theme, the more contextual the commit messages will be.

## Disabling Theme

To disable theme, set it to empty string:

```yaml
theme: ""  # No theme
```

Or remove the `OLLAMA_THEME` environment variable.

## Tips

1. **Be Specific**: Use specific themes like "kubernetes microservices" instead of just "cloud"
2. **Match Your Project**: Choose a theme that accurately represents your codebase
3. **Test First**: Use `--once` mode to test theme effectiveness before continuous deployment
4. **Combine with System Prompt**: The theme works with your system prompt for best results

## Testing Different Themes

```bash
# Test with kubernetes theme
OLLAMA_THEME="kubernetes" python3 main.py --once

# Test with docker theme
OLLAMA_THEME="docker" python3 main.py --once

# Test without theme
OLLAMA_THEME="" python3 main.py --once
```

## Example Output Comparison

### Same File Changes, Different Themes

**File change**: Modified deployment configuration

**No theme:**
```
feat: update deployment configuration
```

**Kubernetes theme:**
```
feat: update deployment replica count and resource limits
```

**Docker theme:**
```
feat: update container resource constraints in compose file
```

**Terraform theme:**
```
feat: update compute instance resource configuration
```

The theme helps Ollama understand the context and use appropriate terminology!

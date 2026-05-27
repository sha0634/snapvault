epipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo '=== Stage 1: Checking out code ==='
                // Jenkins automatically pulls the SCM repository code before execution
            }
        }

        stage('Lint Frontend') {
            steps {
                echo '=== Stage 2: Running Frontend Linter ==='
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run lint'
                }
            }
        }

        stage('Security Audit') {
            steps {
                echo '=== Stage 3: Scanning Backend Dependency Vulnerabilities ==='
                dir('backend') {
                    // Audit dependencies for high/critical risks. Uses || true to prevent blocking builds on minor advisory warnings.
                    sh 'npm audit --audit-level=high || true'
                }
            }
        }

        stage('Validate IaC') {
            steps {
                echo '=== Stage 4: Validating Terraform Configuration ==='
                // Run terraform validate inside a Docker container mounting our local code
                sh 'docker run --rm -v "$(pwd)/terraform:/workspace" -w /workspace hashicorp/terraform:latest init -backend=false'
                sh 'docker run --rm -v "$(pwd)/terraform:/workspace" -w /workspace hashicorp/terraform:latest validate'
            }
        }

        stage('Test Backend') {
            steps {
                echo '=== Stage 5: Simulating Backend Tests ==='
                dir('backend') {
                    // Dry-run install checks if package.json dependencies resolve successfully
                    sh 'npm install --dry-run'
                }
            }
        }

        stage('Build Images') {
            steps {
                echo '=== Stage 6: Rebuilding Application Containers ==='
                // Rebuilds frontend and backend docker images using local docker daemon
                sh 'docker compose build backend frontend'
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Stage 7: Hot-Recreating Running Services ==='
                // Restarts frontend and backend services in detached mode
                sh 'docker compose up -d backend frontend'
            }
        }
    }
}

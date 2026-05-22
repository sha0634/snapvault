pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                echo '=== Stage 1: Checking out code ==='
                // Jenkins automatically pulls the SCM repository code before execution
            }
        }

        stage('Test Backend') {
            steps {
                echo '=== Stage 2: Simulating Backend Tests ==='
                dir('backend') {
                    // Dry-run install checks if package.json dependencies resolve successfully
                    sh 'npm install --dry-run'
                }
            }
        }

        stage('Build Images') {
            steps {
                echo '=== Stage 3: Rebuilding Application Containers ==='
                // Rebuilds frontend and backend docker images using local docker daemon
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                echo '=== Stage 4: Hot-Recreating Running Services ==='
                // Restarts frontend and backend services in detached mode
                sh 'docker compose up -d'
            }
        }
    }
}

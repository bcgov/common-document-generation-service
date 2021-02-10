#!groovy

// --------------------
// Declarative Pipeline
// --------------------
pipeline {
  agent any

  environment {
    // Enable pipeline verbose debug output if greater than 0
    DEBUG_OUTPUT = 'false'

    // Get projects/namespaces from config maps
    DEV_PROJECT = new File('/var/run/configs/ns/project.dev').getText('UTF-8').trim()
    TEST_PROJECT = new File('/var/run/configs/ns/project.test').getText('UTF-8').trim()
    PROD_PROJECT = new File('/var/run/configs/ns/project.prod').getText('UTF-8').trim()
    TOOLS_PROJECT = new File('/var/run/configs/ns/project.tools').getText('UTF-8').trim()

    // Get application config from config maps
    REPO_OWNER = new File('/var/run/configs/jobs/repo.owner').getText('UTF-8').trim()
    REPO_NAME = new File('/var/run/configs/jobs/repo.name').getText('UTF-8').trim()
    APP_NAME = new File('/var/run/configs/jobs/app.name').getText('UTF-8').trim()
    APP_DOMAIN = new File('/var/run/configs/jobs/app.domain').getText('UTF-8').trim()

    // JOB_NAME should be the pull request/branch identifier (i.e. 'pr-5')
    JOB_NAME = JOB_BASE_NAME.toLowerCase()

    // SOURCE_REPO_* references git repository resources
    SOURCE_REPO_RAW = "https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/master"
    SOURCE_REPO_REF = 'master'
    SOURCE_REPO_URL = "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

    // ENV_HOST is the full domain without the path (ie. 'appname-dev.apps.silver.devops.gov.bc.ca')
    INSTANCE = "${JOB_NAME.equalsIgnoreCase('master') ? '' : '-' + JOB_NAME}"
    DEV_HOST = "${APP_NAME}-dev${INSTANCE}.${APP_DOMAIN}"
    TEST_HOST = "${APP_NAME}-test.${APP_DOMAIN}"
    PROD_HOST = "${APP_NAME}.${APP_DOMAIN}"
  }

  options {
    parallelsAlwaysFailFast()
  }

  stages {
    stage('Initialize') {
      agent any
      steps {
        // Cancel any running builds in progress
        timeout(10) {
          echo "Cancelling previous ${APP_NAME}-${JOB_NAME} builds in progress..."
          abortAllPreviousBuildInProgress(currentBuild)
        }

        script {
          if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
            // Force OpenShift Plugin directives to be verbose
            openshift.logLevel(1)

            // Print all environment variables
            echo 'DEBUG - All pipeline environment variables:'
            echo sh(returnStdout: true, script: 'env')
          }

          loadCommonPipeline()
        }
      }
    }

    stage('Build') {
      agent any
      steps {
        script {
          loadCommonPipeline()
          commonPipeline.runStageBuild()
        }
      }
      post {
        success {
          echo 'Cleanup BuildConfigs...'
          script {
            openshift.withCluster() {
              openshift.withProject(TOOLS_PROJECT) {
                if(DEBUG_OUTPUT.equalsIgnoreCase('true')) {
                  echo "DEBUG - Using project: ${openshift.project()}"
                } else {
                  def bcApp = openshift.selector('bc', "${REPO_NAME}-app-${JOB_NAME}")

                  if(bcApp.exists()) {
                    echo "Removing BuildConfig ${REPO_NAME}-app-${JOB_NAME}..."
                    bcApp.delete()
                  }
                }
              }
            }
          }
        }
      }
    }

    stage('Deploy - Dev') {
      agent any
      steps {
        script {
          loadCommonPipeline()
          commonPipeline.runStageDeploy('Dev', DEV_PROJECT, DEV_HOST, '')
        }
      }
      post {
        success {
          script {
            commonPipeline.createDeploymentStatus(DEV_PROJECT, 'SUCCESS', JOB_NAME, DEV_HOST, '')
            commonPipeline.notifyStageStatus('Deploy - Dev', 'SUCCESS')
          }
        }
        unsuccessful {
          script {
            commonPipeline.createDeploymentStatus(DEV_PROJECT, 'FAILURE', JOB_NAME, DEV_HOST, '')
            commonPipeline.notifyStageStatus('Deploy - Dev', 'FAILURE')
          }
        }
      }
    }

    stage('Deploy - Test') {
      agent any
      steps {
        script {
          loadCommonPipeline()
          commonPipeline.runStageDeploy('Test', TEST_PROJECT, TEST_HOST, '')
        }
      }
      post {
        success {
          script {
            commonPipeline.createDeploymentStatus(TEST_PROJECT, 'SUCCESS', JOB_NAME, TEST_HOST, '')
            commonPipeline.notifyStageStatus('Deploy - Test', 'SUCCESS')
          }
        }
        unsuccessful {
          script {
            commonPipeline.createDeploymentStatus(TEST_PROJECT, 'FAILURE', JOB_NAME, TEST_HOST, '')
            commonPipeline.notifyStageStatus('Deploy - Test', 'FAILURE')
          }
        }
      }
    }

    stage('Deploy - Prod') {
      agent any
      steps {
        script {
          loadCommonPipeline()
          commonPipeline.runStageDeploy('Prod', PROD_PROJECT, PROD_HOST, '')
        }
      }
      post {
        success {
          script {
            commonPipeline.createDeploymentStatus(PROD_PROJECT, 'SUCCESS', JOB_NAME, PROD_HOST, '')
            commonPipeline.notifyStageStatus('Deploy - Prod', 'SUCCESS')
          }
        }
        unsuccessful {
          script {
            commonPipeline.createDeploymentStatus(PROD_PROJECT, 'FAILURE', JOB_NAME, PROD_HOST, '')
            commonPipeline.notifyStageStatus('Deploy - Prod', 'FAILURE')
          }
        }
      }
    }
  }
}

// --------------------
// Supporting Functions
// --------------------

// Load Common Code as Global Variable
def loadCommonPipeline() {
  if (!binding.hasVariable('commonPipeline')) {
    commonPipeline = load "${WORKSPACE}/openshift/commonPipeline.groovy"
  }
}

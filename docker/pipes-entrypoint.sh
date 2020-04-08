#!/usr/bin/env bash


cat >application.properties <<EOF
# this is where the UI will be running, make sure the port is not used
server.port=$SERVERPORT

# MarkLogic DHF settings
mlHost=$ML_HOST_NAME
mlStagingPort=$STAGING_PORT
mlAppServicesPort=$APPSERVICES_PORT
mlAdminPort=$ADMIN_PORT
mlManagePort=$MANAGE_PORT
mlModulesDatabase=data-hub-MODULES
mlUsername=$MARKLOGIC_ADMIN_USERNAME
mlPassword=$MARKLOGIC_ADMIN_PASSWORD

# this is the root of your DHF project to deploy backend modules to
mlDhfRoot=/DHF
EOF



exec "$@"

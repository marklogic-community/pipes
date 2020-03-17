#!/usr/bin/env bash


cat >application.properties <<EOF
# this is where the UI will be running, make sure the port is not used
server.port=$SERVERPORT

# MarkLogic DHF settings
mlHost=$MLHOST
mlStagingPort=$MLSTAGINGPORT
mlAppServicesPort=$MLAPPSERVICESPORT
mlAdminPort=$MLADMINPORT
mlManagePort=$MLMANAGEPORT
mlUsername=$MLUSERNAME 
mlPassword=$MLPASSWORD
mlModulesDatabase=data-hub-MODULES

# this is the root of your DHF project to deploy backend modules to
mlDhfRoot=DHF
EOF



exec "$@"

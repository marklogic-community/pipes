~/MarkLogic/apps/mlcp-10.0.2/bin/mlcp.sh export -mode "local" -host "localhost" \
    -port "8025" -username admin -password admin \
    -collection_filter "safetyreport-source" \
    -output_file_path "./data/SafetyReports/SafetyReportsSample.xml"

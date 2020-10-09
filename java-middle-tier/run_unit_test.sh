cd test-dhf-project
echo Deploy application
./gradlew mlDeploy
ret=$?
if [ $ret -ne 0 ]; then
    echo "DEPLOYMENT ERROR"
    exit $ret
fi
cd ..
cp -v -r ../ml-backend/src/* src/main/resources/dhf/src/.
echo Running unit tests
gradle clean test
ret=$?
if [ $ret -ne 0 ]; then
    echo "UNIT TEST ERROR"
    exit $ret
fi
echo Uninstall application
cd test-dhf-project
./gradlew mlUndeploy -Pconfirm=true
echo "ALL TEST OK"

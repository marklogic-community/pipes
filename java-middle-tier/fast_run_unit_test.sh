cp -v -r ../ml-backend/src/* src/main/resources/dhf/src/.
echo Running unit tests
gradle clean test
ret=$?
if [ $ret -ne 0 ]; then
    echo "UNIT TEST ERROR"
    exit $ret
fi
echo "ALL TEST OK"

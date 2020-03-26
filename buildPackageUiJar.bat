
echo Packaging the front end...
copy /Y node_modules_override\litegraph.js node_modules\litegraph.js\build\litegraph.js
call quasar build

echo Moving the front-end package to SpringBoot static resources folder...
if exist java-middle-tier\src\main\resources\static rd /s /q java-middle-tier\src\main\resources\static
mkdir java-middle-tier\src\main\resources\static

xcopy /s /e /y dist\spa java-middle-tier\src\main\resources\static\.

echo Moving the back-end modules to SpringBoot dhf resources folder...
if exist java-middle-tier\src\main\resources\dhf\src rd /s /q java-middle-tier\src\main\resources\dhf\src
mkdir java-middle-tier\src\main\resources\dhf\src

xcopy /s /e /y ml-backend\src java-middle-tier\src\main\resources\dhf\src

echo Deleting existing builds in java-middle-tier\build\libs...
del /F /Q java-middle-tier\build\libs

echo Building the jar...
java-middle-tier\gradlew.bat bootJar -p java-middle-tier --warn

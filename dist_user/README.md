# Low code visual programming component

## Copy modules in DHF
copy ./DHF/src/* to your DHF ./src/*

## Deploy modules in your DHF
gradle  mlReloadModules

## Install quasar CLI:

$ yarn global add quasar/cli

or:

$ npm install -g quasar/cli

## Update proxy rule to match your own configuration (To DHF staging DH )
File is ./proxy_rule.js

## Run from ./dist/DesignerUI

$ quasar serve --proxy ../proxy_rule.js
You can also use https with this option --https



## For usage demo see:
https://wiki.marklogic.com/display/SAL/DHF+-+Low+code+visual+programming+concept+-+Demo


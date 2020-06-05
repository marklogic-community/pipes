- Run and make sure the java unit tests work
- Publish the mlBundle (check that the version is correct)
- Tag the commit in the candidate branch with "1.1-release" (example for release 1.1):
    - ```git tag -a 1.1-release```
- Build the jar
- Go to https://github.com/marklogic-community/pipes/releases:
    - create a new Draft release and write a description
    - list issues closed (look at previous releases)
- Assign the new tag ("1.1-release" in our example)
- Publish the release
- Let people know in Slack channels
- Merge the branch into master
- Create a new release candidate branch:
    - ```git checkout -b release/1.2-candidate```



# Envision Website
This branch contains the code that generates the github.io website for Envision.

Before you can get going you must have Ruby installed. This project has .ruby-version and .ruby-gem files if you are using [RVM](https://rvm.io/).

This process has been tested successfully on Ruby version 2.6.3.  ( And Ruby 2.5.8 on windows 10 )

```
$ ruby --version
ruby 2.6.3...
```

# Setup

### Ensure necessary tools are installed
```bash
gem install bundler
gem install jekyll
```
Using windows 10 you may have to do the following before installing the necessary ruby gems:
```bash
bundle update --bundler
```
### Install the necessary Ruby gems
```bash
bundle install
```


# Viewing the Website

This website is written using [Jekyll](https://jekyllrb.com/) and Markdown. You can read about creating github pages websites [here](https://pages.github.com/).

### Run the Jekyll Server
```bash
jekyll serve 
```
on windows 10:
```bash
bundle exec jekyll serve
```

Open the docs website at the server address displayed in the terminal, e.g.: 

`http://127.0.0.1:4000/envision/`

### Making Content Changes

Most of the content is located in `_pages` with screenshots in `images`. Making changes to files in the site prompts Jekyll to regenerate the website.

### Updating the Live website
There is a travis job that builds and deploys the website every time a push is made to the **docs** branch.

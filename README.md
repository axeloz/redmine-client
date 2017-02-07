![screenshot](https://github.com/axeloz/redmine-client/blob/dev/screenshot.png)

# [WIP] Desktop Redmine client application

Based on Electron, this app can be launched on any Mac, Linux or Windows computer. 

**This is a Work In Progress**

So many things left to be done, working on it. This is not stable yet, nor really useful. More features to come soon.

## So what is working?

Listing: 
  - issues assigned to you
  - issues you have created
  - issues you are watching
  - all issues

Filtering: 
  - projects
  - trackers
  - statuses
  - priorities

## Usage

Checkout the repo, install the dependencies and run Gulp. 
There is no build yet, will be done soon.

```
git clone git@github.com:axeloz/redmine-client.git
cd redmine-client
npm install
gulp
```


## TODO
  - Add a settings page
  - Add pagination (infinite loading?)
  - Fix bugs (!)
  - Add sorting
  - Add time tracking
  - Add ability to modify a task (status, comment, ...)
  - Add a loader when requesting the API
  - Finish filtering feature
  - Search a task by ID
  - Manage projects and subprojects


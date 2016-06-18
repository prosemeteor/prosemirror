#Welcome to ProseMeteor.
ProseMeteor is a package integrating [ProseMirror](https://prosemirror.net/) and [Meteor.js](http://docs.meteor.com/#/full/).
ProseMeteor is built for Meteor 1.3+

#Goals
The primary goal is to provide a package that provides realtime collaborative WYSIWYG editing.

Discussion for the ProseMeteor project will take place on Humon [ProseMeteor Wiki](https://humon.com/Prosemeteor/RJsnS9dyAH8k6cuma/Home/STisHoM8MxcqgTxGw)

The wiki is readable by everyone but if you would like to contribute please contact funkyeah@gmail.com for an invite.


## Developing
To run the demo, use the `run_demo.sh` script. First give it executable permissions with `chmod +x ./run_demo`, then run it with `./run_demo`.


### File Structure

* `/demo` contains an example application
* `/package.js` the Meteor atmosphere package file. Defines the `prosemeteor:prosemirror` package info and main code modules to include
* `/lib/` directory that contains all source code
* `/lib/client/client-main.js` the main entry point file for the client. exports client API
* `/lib/server/server-main.js` the main entry point file for the server. exports server API
* `/lib/imports/` all JS modules used by the package
* `/lib/imports/startup/` all code for client and server that's run at startup
* `/lib/imports/api/` package api's used internally

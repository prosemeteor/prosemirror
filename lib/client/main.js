import { Meteor } from 'meteor/meteor';

import { ProseMirror } from "prosemirror/dist/edit"
import "prosemirror/dist/inputrules/autoinput"
import "prosemirror/dist/menu/tooltipmenu"
import "prosemirror/dist/menu/menubar"
import "prosemirror/dist/collab"

export const Prosemirror = ProseMirror;
export let Prosepipe = new Meteor.Streamer('prosemirror-pipe');

import '../imports/startup/client/index.js';
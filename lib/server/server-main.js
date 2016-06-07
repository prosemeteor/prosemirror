// start up server
import './../imports/startup/server/server-index';

import './../imports/api/documents/both/methods';

import { ProseMeteorServer as ProseMeteorServerClass } from './../imports/api/prosemeteor/server/prosemeteor-server';

export let ProseMeteorServer = ProseMeteorServerClass;

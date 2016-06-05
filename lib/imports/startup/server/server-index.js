import { ProseMeteorServer } from './../../api/prosemeteor/server/prosemeteor-server';
import { documentsColl } from './../../api/documents/both/collection';

// data fixtures
import './fixtures/document-fixture';

let proseMeteorServer = new ProseMeteorServer({ documentsColl });

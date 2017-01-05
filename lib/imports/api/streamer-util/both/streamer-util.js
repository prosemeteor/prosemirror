/**
 * Generates a streamer event name, with optional params.
 * @example
 *  generateEventName({ name: 'start', params: { id: 123, type: 'foo' }}) => 'start-id:123-type:foo'
 * @param name
 * @param params
 */
const generateEventName = ({ name, params }) => {
  let str = `${name}`;
  if (Object.keys(params).length > 0) {
    for (const thisKey in params) {
      str += `-${thisKey}:${params[thisKey]}`;
    }
  }
  return str;
};

export {
  generateEventName
};

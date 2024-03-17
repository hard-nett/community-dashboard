import { fromUtf8 } from '@cosmjs/encoding';
export const convertTendermintEvents = (events) => {
  return events.map((event) => ({
    type: event.type,
    attributes: event.attributes.map((attribute) => ({
      key: fromUtf8(attribute.key),
      value: fromUtf8(attribute.value)
    }))
  }));
};

const React = require('react');

function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
        return;
      }

      if (ref && typeof ref === 'object') {
        ref.current = node;
      }
    });
  };
}

const Slot = React.forwardRef(function Slot({ children, ...slotProps }, forwardedRef) {
  if (!React.isValidElement(children)) {
    return children ?? null;
  }

  const childProps = children.props ?? {};
  const mergedProps = {
    ...slotProps,
    ...childProps,
  };

  if (slotProps.style || childProps.style) {
    mergedProps.style = [slotProps.style, childProps.style].filter(Boolean);
  }

  Object.keys(slotProps).forEach((key) => {
    if (
      key.startsWith('on') &&
      typeof slotProps[key] === 'function' &&
      typeof childProps[key] === 'function'
    ) {
      mergedProps[key] = (...args) => {
        slotProps[key](...args);
        childProps[key](...args);
      };
    }
  });

  const childRef = children.ref ?? childProps.ref;

  if (forwardedRef || childRef) {
    mergedProps.ref = mergeRefs(forwardedRef, childRef);
  }

  return React.cloneElement(children, mergedProps);
});

module.exports = {
  Slot,
};

import React from "react";

const ToggleableComponent = ({ isVisible, children }) => {
  return isVisible ? <div className="toggleableDiv">{children}</div> : null;
};

export default ToggleableComponent;

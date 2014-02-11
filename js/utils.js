/* http://api.jquery.com/jQuery.Callbacks/ */
var topics = {};
jQuery.Topic = function(id) {
  var callbacks,
    method,
    topic = id && topics[id];
  if (!topic) {
    callbacks = jQuery.Callbacks();
    topic = {
      publish: callbacks.fire,
      subscribe: callbacks.add,
      unsubscribe: callbacks.remove
    };
    if (id) {
      topics[id] = topic;
    }
  }
  return topic;
};

Function.prototype.debounce = function (threshold, execAsap) {
  var func = this, timeout;
  return function debounced () {
    var obj = this, args = arguments;
      function delayed () {
        if (!execAsap)
          func.apply(obj, args);
        timeout = null; 
      }; 
      if (timeout)
        clearTimeout(timeout);
      else if (execAsap)
        func.apply(obj, args);
      timeout = setTimeout(delayed, threshold || 100); 
  };
};
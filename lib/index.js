var model = require('./model');

function init(){
  
  return {
    "init": model.init,
    "push": model.push,
  }
}

module.exports = init();

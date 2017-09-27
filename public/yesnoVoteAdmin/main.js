var brain;

Object.values = obj => Object.keys(obj).map(key => obj[key]);

window.onload = function() {
  brain = new Brain();
};

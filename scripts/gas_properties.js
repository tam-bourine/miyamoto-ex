// scripts/gas_propeties.js begin
// KVS

loadGASProperties = function (exports) {
  var GASProperties = function() {
     this.properties = PropertiesService.getScriptProperties();
  };

  GASProperties.prototype.get = function(key) {
    return this.properties.getProperty(key);
  };

  GASProperties.prototype.set = function(key, val) {
    this.properties.setProperty(key, val);
    return val;
  };

  GASProperties.prototype.remove = function(key) {
    var isSuccess = false;
    try {
      this.properties.deleteProperty(key);
      Logger.log('>>>>>>> ScriptPropertyの削除に成功');
      isSuccess = true;
    } catch (e) {
      Logger.log('>>>>>>> ScriptPropertyの削除に失敗: %s', e);
    }
    return isSuccess;
  };

  return GASProperties;
};

if(typeof exports !== 'undefined') {
  exports.GASProperties = loadGASProperties();
}
// scripts/gas_propeties.js end

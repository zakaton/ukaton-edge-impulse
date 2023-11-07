/* global THREE, BaseMission, BaseMissions */

class BluetoothMissionDevice extends BaseMission {
  constructor() {
    super();

    this._wifiSSID = null;
    this._wifiPassword = null;
    this._wifiConnect = null;
    this._isWifiConnected = null;
    this._wifiMACAddress = null;
    this._wifiIPAddress = null;
  }

  get isConnected() {
    return this._device && this._device.gatt.connected;
  }
  GENERATE_UUID(value) {
    return `5691eddf-${value}-4420-b7a5-bb8751ab5181`;
  }
  async connect() {
    this.log("attempting to connect...");
    if (this.isConnected) {
      this.log("already connected");
      return;
    }

    this.log("getting device...");
    this._device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          services: [this.GENERATE_UUID("0000")]
        }
      ],
      optionalServices: ["battery_service"]
    });
    this.log("got device!");
    this._device.addEventListener(
      "gattserverdisconnected",
      this._onGattServerDisconnected.bind(this)
    );

    this.log("getting server");
    this._server = await this._device.gatt.connect();
    this.log("got server!");
    
    // BATTERY SERVICE/CHARACTERITICS
    this.log("getting battery service...");
    this._batteryService = await this._server.getPrimaryService(
      "battery_service"
    );
    this.log("got battery service!");

    this.log("getting battery level characteristic...");
    this._batteryLevelCharacteristic = await this._batteryService.getCharacteristic(
      "battery_level"
    );
    this.log("got battery level characteristic!");

    this._batteryLevelCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onBatteryLevelCharacteristicValueChanged.bind(this)
    );
    this.log("starting battery level notifications...");
    await this._batteryLevelCharacteristic.startNotifications();
    this.log("started battery level notifications!");

    this.log("getting service...");
    this._service = await this._server.getPrimaryService(
      this.GENERATE_UUID("0000")
    );
    this.log("got service!");

    // DEBUG
    this.log("getting debug characteristic...");
    this._debugCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("1001")
    );
    this.log("got debug characteristic!");

    this.log("getting debug value...");
    await this.getDebug();
    this.log("got debug value!");

    // ERROR MESSAGE
    this.log("getting error message characteristic...");
    this._errorMessageCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("2001")
    );
    this.log("got error message characteristic!");

    this._errorMessageCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onErrorMessageCharacteristicValueChanged.bind(this)
    );
    this.log("starting error message  notifications...");
    await this._errorMessageCharacteristic.startNotifications();
    this.log("started error message notifications!");

    // TYPE
    this.log("getting type characteristic...");
    this._typeCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("3001")
    );
    this.log("got type characteristic!");

    this.log("getting type value...");
    await this.getType();
    this.log("got type value!");

    // NAME
    this.log("getting name characteristic...");
    this._nameCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("4001")
    );
    this.log("got name characteristic!");

    this.log("getting name...");
    await this.getName();
    this.log("got name value!");

    // MOTION CALIBRATION
    this.log("getting motion calibration characteristic...");
    this._motionCalibrationCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("5001")
    );
    this.log("got motion calibration characteristic!");

    this._motionCalibrationCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onMotionCalibrationCharacteristicValueChanged.bind(this)
    );
    this.log("starting motion calibration notifications...");
    await this._motionCalibrationCharacteristic.startNotifications();
    this.log("started imu calibration notifications!");

    // SENSOR DATA CONFIGURATION
    this.log("getting sensor data configuration characteristic...");
    this._sensorDataConfigurationCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("6001")
    );
    this.log("got sensor data configuration characteristic!");

    this.log("getting sensor data configuration...");
    await this.getSensorDataConfigurations();
    this.log("got sensor data configuration!");

    // SENSOR DATA
    this.log("getting sensor data characteristic...");
    this._sensorDataCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("6002")
    );
    this.log("got sensor data characteristic!");

    this._sensorDataCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onSensorDataCharacteristicValueChanged.bind(this)
    );
    this.log("starting sensor data notifications...");
    await this._sensorDataCharacteristic.startNotifications();
    this.log("started sensor data notifications!");
    
    // WEIGHT DATA DELAY
    this.log("getting weight data delay characteristic...");
    this._weightDataDelayCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("8001")
    );
    this.log("got weight data delay characteristic!");

    this.log("getting weight data delay...");
    await this.getWeightDataDelay();
    this.log("got weight data delay!");
    
    // WEIGHT DATA
    this.log("getting weight data characteristic...");
    this._weightDataCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("8002")
    );
    this.log("got weight data characteristic!");

    this._weightDataCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onWeightDataCharacteristicValueChanged.bind(this)
    );
    this.log("starting weight data notifications...");
    await this._weightDataCharacteristic.startNotifications();
    this.log("started weight data notifications!");

    // WIFI CHARACTERITICS
    this.log("getting wifi ssid characteristic...");
    this._wifiSSIDCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("7001")
    );
    await this.getWifiSSID();
    this.log("got wifi ssid characteristic!");

    this.log("getting wifi password characteristic...");
    this._wifiPasswordCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("7002")
    );
    await this.getWifiPassword();
    this.log("got wifi password characteristic!");

    this.log("getting wifi connect characteristic...");
    this._wifiConnectCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("7003")
    );
    await this.getWifiConnect();
    this.log("got wifi connect characteristic!");

    this.log("getting wifi is connected characteristic...");
    this._isWifiConnectedCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("7004")
    );
    await this.isWifiConnected();
    this.log("got wifi is connected characteristic!");
    this._isWifiConnectedCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onWifiIsConnectedCharacteristicValueChanged.bind(this)
    );
    this.log("starting wifi is connected notifications...");
    await this._isWifiConnectedCharacteristic.startNotifications();
    this.log("started wifi is connected notifications!");

    this.log("getting wifi IP address characteristic...");
    this._wifiIPAddressCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("7005")
    );
    await this.getWifiIPAddress();
    this.log("got wifi IP address characteristic!");

    this._wifiIPAddressCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onWifiIPAddressCharacteristicValueChanged.bind(this)
    );
    this.log("starting wifi IP address notifications...");
    await this._wifiIPAddressCharacteristic.startNotifications();
    this.log("started wifi IP address notifications!");

    this.log("getting wifi MAC address characteristic...");
    this._wifiMACAddressCharacteristic = await this._service.getCharacteristic(
      this.GENERATE_UUID("7006")
    );
    await this.getWifiMACAddress();
    this.log("got wifi MAC address characteristic!");

    this._wifiMACAddressCharacteristic.addEventListener(
      "characteristicvaluechanged",
      this._onWifiMACAddressCharacteristicValueChanged.bind(this)
    );
    this.log("starting wifi MAC address notifications...");
    await this._wifiMACAddressCharacteristic.startNotifications();
    this.log("started wifi MAC address notifications!");

    // COMPLETED
    this.log("connection complete!");
    this.dispatchEvent({ type: "connected" });
  }

  _onGattServerDisconnected(event) {
    this.log("disconnected");
    this.dispatchEvent({ type: "disconnected" });
    if (this._reconnectOnDisconnection) {
      this.log("attempting to reconnect...");
      this._device.gatt.connect();
    }
  }
  
  // BATTERY LEVEL
  _onBatteryLevelCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this._parseBatteryLevel(dataView);
  }

  // DEBUG
  async getDebug() {
    this._assertConnection();

    if (this._debug == null) {
      const dataView = await this._debugCharacteristic.readValue();
      this._debug = Boolean(dataView.getUint8(0));
      this._onDebugUpdate();
    }
    return this._debug;
  }
  async setDebug(debug) {
    this._assertConnection();

    this.log(`setting debug value to ${debug}...`);
    await this._debugCharacteristic.writeValueWithResponse(
      Uint8Array.of([debug ? 1 : 0])
    );
    this._debug = Boolean(this._debugCharacteristic.value.getUint8(0));
    this._onDebugUpdate();
  }

  // ERROR MESSAGE
  _onErrorMessageCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    const errorMessage = this.textDecoder.decode(dataView);
    this.log(`error message: ${errorMessage}`);
    this.dispatchEvent({
      type: "errorMessage",
      message: { errorMessage }
    });
  }

  // TYPE
  async getType() {
    this._assertConnection();

    if (this._type == null) {
      this.log("requesting type...");
      const dataView = await this._typeCharacteristic.readValue();
      this._type = dataView.getUint8(0);
      this._onTypeUpdate();
    }
    return this._type;
  }
  async setType(newType) {
    this._assertConnection();

    this.log(`setting type to ${newType}...`);

    if (!this.isValidType(newType)) {
      throw `invalid type ${newType}`;
    }

    await this._typeCharacteristic.writeValueWithResponse(
      Uint8Array.from([newType])
    );
    this._type = this._typeCharacteristic.value.getUint8(0);
    this._onTypeUpdate();

    return this._type;
  }

  // NAME
  async getName() {
    this._assertConnection();

    if (this._name == null) {
      const dataView = await this._nameCharacteristic.readValue();
      this._name = this.textDecoder.decode(dataView);
      this._onNameUpdate();
    }
    return this._name;
  }
  async setName(newName) {
    this._assertConnection();

    newName = newName.substr(0, 30);
    await this._nameCharacteristic.writeValueWithResponse(
      this.textEncoder.encode(newName)
    );
    this._name = this.textDecoder.decode(this._nameCharacteristic.value);
    this._onNameUpdate();
    return this._name;
  }

  // MOTION CALIBRATION
  _onMotionCalibrationCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this._parseMotionCalibration(dataView);
  }

  // SENSOR DATA CONFIGURATION
  async getSensorDataConfigurations() {
    this._assertConnection();
    
    if (this._sensorDataConfigurations == null) {
      const dataView = await this._sensorDataConfigurationCharacteristic.readValue();
      this.log("getting sensor data configuration", dataView);
      this._parseSensorDataConfigurations(dataView);
    }
    return this._sensorDataConfigurations;
  }

  async setSensorDataConfigurations(configurations = {}) {
    this._assertConnection();

    const flattenedConfigurations = this._flattenSensorConfigurations(
      configurations
    );
    await this._sensorDataConfigurationCharacteristic.writeValueWithResponse(
      flattenedConfigurations
    );
    const dataView = await this._sensorDataConfigurationCharacteristic.readValue();
    this._parseSensorDataConfigurations(dataView);
    return this.getSensorDataConfigurations();
  }

  // SENSOR DATA
  _onSensorDataCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this.log("received sensor data", dataView);
    this._parseSensorData(dataView);
  }
  
  // WEIGHT DATA DELAY
  async getWeightDataDelay() {
    this._assertConnection();
    
    if (this._weightDelay == null) {
      const dataView = await this._weightDataDelayCharacteristic.readValue();
      this.log("getting weight data delay", dataView);
      this._weightDataDelay = dataView.getUint16(0, true);
      this._onWeightDataDelayUpdate();
    }
    return this._weightDelay;
  }

  async setWeightDataDelay(delay) {
    this._assertConnection();
    await this._weightDataDelayCharacteristic.writeValueWithResponse(Uint16Array.of([delay]));
    const dataView = await this._weightDataDelayCharacteristic.readValue();
    this._weightDataDelay = dataView.getUint16(0, true);
    this._onWeightDataDelayUpdate();
    return this._weightDataDelay;
  }
  
  // WEIGHT DATA
  _onWeightDataCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this.log("received weight data", dataView);
    this._weight = dataView.getFloat32(0, true);
    this._onWeightDataUpdate();
  }

  // WIFI
  async getWifiSSID() {
    this._assertConnection();

    if (this._wifiSSID !== null) {
      return this._wifiSSID;
    } else {
      const dataView = await this._wifiSSIDCharacteristic.readValue();
      const wifiSSID = this.textDecoder.decode(dataView);
      this._wifiSSID = wifiSSID;
      this._onWifiSSIDUpdate();
      return this._wifiSSID;
    }
  }
  async setWifiSSID(wifiSSID) {
    this._assertConnection();

    this.log(`setting wifi ssid to ${wifiSSID}...`);
    await this._wifiSSIDCharacteristic.writeValueWithResponse(
      this.textEncoder.encode(wifiSSID)
    );
    this._wifiSSID = this.textDecoder.decode(
      this._wifiSSIDCharacteristic.value
    );
    this._onWifiSSIDUpdate();
    return this._wifiSSID;
  }
  _onWifiSSIDUpdate() {
    this.log(`wifi ssid is ${this._wifiSSID}`);
    this.dispatchEvent({
      type: "wifissid",
      message: { wifiSSID: this._wifiSSID }
    });
  }

  async getWifiPassword() {
    this._assertConnection();

    if (this._wifiPassword !== null) {
      return this._wifiPassword;
    } else {
      const dataView = await this._wifiPasswordCharacteristic.readValue();
      const wifiPassword = this.textDecoder.decode(dataView);
      this._wifiPassword = wifiPassword;
      this._onWifiPasswordUpdate();
      return this._wifiPassword;
    }
  }
  async setWifiPassword(wifiPassword) {
    this._assertConnection();

    this.log(`setting wifi ssid to ${wifiPassword}...`);
    await this._wifiPasswordCharacteristic.writeValueWithResponse(
      this.textEncoder.encode(wifiPassword)
    );
    this._wifiPassword = this.textDecoder.decode(
      this._wifiPasswordCharacteristic.value
    );
    this._onWifiPasswordUpdate();
    return this._wifiPassword;
  }
  _onWifiPasswordUpdate() {
    this.log(`wifi password is ${this._wifiPassword}`);
    this.dispatchEvent({
      type: "wifipassword",
      message: { wifiPassword: this._wifiPassword }
    });
  }

  async isWifiConnected() {
    this._assertConnection();

    if (this._isWifiConnected !== null) {
      return this._isWifiConnected;
    } else {
      const dataView = await this._isWifiConnectedCharacteristic.readValue();
      this._isWifiConnected = Boolean(dataView.getUint8(0));
      this._onWifiIsConnectedUpdate();
      return this._isWifiConnected;
    }
  }
  _onWifiIsConnectedCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this._isWifiConnected = Boolean(dataView.getUint8(0));
    this._onWifiIsConnectedUpdate();
  }
  _onWifiIsConnectedUpdate() {
    this.log(
      `wifi is ${this._isWifiConnected ? "connected" : "not connected"}`
    );
    this.dispatchEvent({
      type: "iswificonnected",
      message: { isWifiConnected: this._isWifiConnected }
    });
  }

  async getWifiConnect() {
    this._assertConnection();

    if (this._wifiConnect !== null) {
      return this._wifiConnect;
    } else {
      const dataView = await this._wifiConnectCharacteristic.readValue();
      this._wifiConnect = Boolean(dataView.getUint8(0));
      this._onWifiConnectUpdate();
      return this._wifiConnect;
    }
  }
  async _setWifiConnection(connect) {
    await this._wifiConnectCharacteristic.writeValueWithResponse(
      Uint8Array.of([connect ? 1 : 0])
    );
    this._wifiConnect = Boolean(
      this._wifiConnectCharacteristic.value.getUint8(0)
    );
    this._onWifiConnectUpdate();
    return this._wifiConnect;
  }
  
  async connectToWifi() {
    return this._setWifiConnection(true);
  }
  async disconnectFromWifi() {
    return this._setWifiConnection(false);
  }
  _onWifiConnectUpdate() {
    this.log(
      `wifi connect is ${this._wifiConnect ? "enabled" : "not enabled"}`
    );
    this.dispatchEvent({
      type: "wificonnect",
      message: { wifiConnect: this._wifiConnect }
    });
  }

  async getWifiIPAddress() {
    this._assertConnection();

    if (this._wifiIPAddress !== null) {
      return this._wifiIPAddress;
    } else {
      const dataView = await this._wifiIPAddressCharacteristic.readValue();
      this._wifiIPAddress = this.textDecoder.decode(dataView);
      this._onWifiIPAddressUpdate();
      return this._wifiIPAddress;
    }
  }
  _onWifiIPAddressCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this._wifiIPAddress = this.textDecoder.decode(dataView);
    this._onWifiIPAddressUpdate();
  }
  _onWifiIPAddressUpdate() {
    this.log(`wifi IP Address: ${this._wifiIPAddress}`);
    this.dispatchEvent({
      type: "wifiipaddress",
      message: { wifiIPAddress: this._wifiIPAddress }
    });
  }

  async getWifiMACAddress() {
    this._assertConnection();

    if (this._wifiMACAddress !== null) {
      return this._wifiMACAddress;
    } else {
      const dataView = await this._wifiMACAddressCharacteristic.readValue();
      this._wifiMACAddress = this.textDecoder.decode(dataView);
      this._onWifiMACAddressUpdate();
      return this._wifiMACAddress;
    }
  }
  _onWifiMACAddressCharacteristicValueChanged(event) {
    const dataView = event.target.value;
    this._wifiMACAddress = this.textDecoder.decode(dataView);
    this._onWifiMACAddressUpdate();
  }
  _onWifiMACAddressUpdate() {
    this.log(`wifi MAC Address: ${this._wifiMACAddress}`);
    this.dispatchEvent({
      type: "wifimacaddress",
      message: { wifiMACAddress: this._wifiMACAddress }
    });
  }
}

class BluetoothMissions extends BaseMissions {
  static get MissionDevice() {
    return BluetoothMissionDevice;
  }
}

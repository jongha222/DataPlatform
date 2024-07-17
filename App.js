import React, {useState, useEffect, useCallback, useRef} from 'react';
import {SafeAreaView, StyleSheet, View, Text, Switch} from 'react-native';
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import Geolocation from 'react-native-geolocation-service';
import {map} from 'rxjs/operators';

const App = () => {
  const [sensorData, setSensorData] = useState({
    accelerometer: {x: 0, y: 0, z: 0, timestamp: ''},
    gyroscope: {x: 0, y: 0, z: 0, timestamp: ''},
    magnetometer: {x: 0, y: 0, z: 0, timestamp: ''},
    gps: {latitude: 0, longitude: 0, timestamp: ''},
  });

  const [isEnabled, setIsEnabled] = useState({
    accelerometer: false,
    gyroscope: false,
    magnetometer: false,
    gps: false,
  });

  const subscriptions = useRef({
    accelerometer: null,
    gyroscope: null,
    magnetometer: null,
    gps: null,
  });

  const setupSensor = useCallback((sensorType, sensorObservable, stateKey) => {
    setUpdateIntervalForType(sensorType, 1000);
    const subscription = sensorObservable
      .pipe(map(data => ({...data, timestamp: new Date().toISOString()})))
      .subscribe(
        data => {
          setSensorData(prevData => ({
            ...prevData,
            [stateKey]: {...data, timestamp: new Date().toISOString()},
          }));
        },
        error => console.log(`${stateKey} is not available`),
      );

    subscriptions.current[stateKey] = subscription;
  }, []);

  const handleToggle = (sensorType, sensorName, sensorObservable) => {
    if (isEnabled[sensorName]) {
      if (subscriptions.current[sensorName]) {
        subscriptions.current[sensorName].unsubscribe();
        subscriptions.current[sensorName] = null;
      }
      setIsEnabled(prev => ({...prev, [sensorName]: false}));
    } else {
      setIsEnabled(prev => ({...prev, [sensorName]: true}));
      if (sensorName !== 'gps') {
        setupSensor(sensorType, sensorObservable, sensorName);
      } else {
        const gpsSubscription = Geolocation.watchPosition(
          position => {
            const {latitude, longitude} = position.coords;
            const timestamp = new Date().toISOString();
            const gpsData = {latitude, longitude, timestamp};
            setSensorData(prevData => ({
              ...prevData,
              gps: {...gpsData, timestamp},
            }));
          },
          error => console.log('GPS is not available'),
          {enableHighAccuracy: true, distanceFilter: 0, interval: 1000},
        );
        subscriptions.current.gps = {
          unsubscribe: () => Geolocation.clearWatch(gpsSubscription),
        };
      }
    }
  };

  useEffect(() => {
    return () => {
      Object.values(subscriptions.current).forEach(subscription => {
        if (subscription) subscription.unsubscribe();
      });
    };
  }, []);

  const formatSensorData = data => JSON.stringify(data, null, 2);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sensor Data</Text>

      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>Accelerometer</Text>
        <Switch
          onValueChange={() =>
            handleToggle(
              SensorTypes.accelerometer,
              'accelerometer',
              accelerometer,
            )
          }
          value={isEnabled.accelerometer}
        />
        {isEnabled.accelerometer && (
          <Text>{formatSensorData(sensorData.accelerometer)}</Text>
        )}
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>Gyroscope</Text>
        <Switch
          onValueChange={() =>
            handleToggle(SensorTypes.gyroscope, 'gyroscope', gyroscope)
          }
          value={isEnabled.gyroscope}
        />
        {isEnabled.gyroscope && (
          <Text>{formatSensorData(sensorData.gyroscope)}</Text>
        )}
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>Magnetometer</Text>
        <Switch
          onValueChange={() =>
            handleToggle(SensorTypes.magnetometer, 'magnetometer', magnetometer)
          }
          value={isEnabled.magnetometer}
        />
        {isEnabled.magnetometer && (
          <Text>{formatSensorData(sensorData.magnetometer)}</Text>
        )}
      </View>

      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>GPS</Text>
        <Switch
          onValueChange={() => handleToggle('gps', 'gps', Geolocation)}
          value={isEnabled.gps}
        />
        {isEnabled.gps && <Text>{formatSensorData(sensorData.gps)}</Text>}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  dataContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});

export default App;

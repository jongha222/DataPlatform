import React, {useState, useEffect} from 'react';
import {SafeAreaView, StyleSheet, View, Text} from 'react-native';
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
  const [accelerometerData, setAccelerometerData] = useState({
    type: 'accelerometer',
    x: 0,
    y: 0,
    z: 0,
    timestamp: '',
  });
  const [gyroscopeData, setGyroscopeData] = useState({
    type: 'gyroscope',
    x: 0,
    y: 0,
    z: 0,
    timestamp: '',
  });
  const [magnetometerData, setMagnetometerData] = useState({
    type: 'magnetometer',
    x: 0,
    y: 0,
    z: 0,
    timestamp: '',
  });
  const [location, setLocation] = useState({
    type: 'gps',
    latitude: 0,
    longitude: 0,
    timestamp: '',
  });

  const sendDataToBackend = sensorData => {
    fetch('http://your-backend-url/sensor-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sensorData),
    })
      .then(response => {
        if (response.ok) {
          console.log('Data sent successfully');
        } else {
          console.error('Error sending data');
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.accelerometer, 1000);
    setUpdateIntervalForType(SensorTypes.gyroscope, 1000);
    setUpdateIntervalForType(SensorTypes.magnetometer, 1000);

    const accelerometerSubscription = accelerometer
      .pipe(
        map(data => ({
          type: 'accelerometer',
          ...data,
          timestamp: new Date().toISOString(),
        })),
      )
      .subscribe(
        data => {
          setAccelerometerData(data);
          sendDataToBackend(data);
        },
        error => console.log('Accelerometer is not available'),
      );

    const gyroscopeSubscription = gyroscope
      .pipe(
        map(data => ({
          type: 'gyroscope',
          ...data,
          timestamp: new Date().toISOString(),
        })),
      )
      .subscribe(
        data => {
          setGyroscopeData(data);
          sendDataToBackend(data);
        },
        error => console.log('Gyroscope is not available'),
      );

    const magnetometerSubscription = magnetometer
      .pipe(
        map(data => ({
          type: 'magnetometer',
          ...data,
          timestamp: new Date().toISOString(),
        })),
      )
      .subscribe(
        data => {
          setMagnetometerData(data);
          sendDataToBackend(data);
        },
        error => console.log('Magnetometer is not available'),
      );

    const locationSubscription = setInterval(() => {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          const timestamp = new Date().toISOString();
          const locationData = {type: 'gps', latitude, longitude, timestamp};
          setLocation(locationData);
          sendDataToBackend(locationData);
        },
        error => console.log('Error getting location', error),
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    }, 10000);

    return () => {
      accelerometerSubscription.unsubscribe();
      gyroscopeSubscription.unsubscribe();
      magnetometerSubscription.unsubscribe();
      clearInterval(locationSubscription);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sensor Data</Text>
      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>Accelerometer Data</Text>
        <Text>{JSON.stringify(accelerometerData, null, 2)}</Text>
      </View>
      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>Gyroscope Data</Text>
        <Text>{JSON.stringify(gyroscopeData, null, 2)}</Text>
      </View>
      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>Magnetometer Data</Text>
        <Text>{JSON.stringify(magnetometerData, null, 2)}</Text>
      </View>
      <View style={styles.dataContainer}>
        <Text style={styles.subtitle}>GPS Data</Text>
        <Text>{JSON.stringify(location, null, 2)}</Text>
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
  title: {fontSize: 20, marginBottom: 20},
  subtitle: {fontSize: 18, marginTop: 20, marginBottom: 10},
  dataContainer: {alignItems: 'center', marginBottom: 20},
});

export default App;

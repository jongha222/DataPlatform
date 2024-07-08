import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  setUpdateIntervalForType,
  SensorTypes,
  magnetometer,
} from 'react-native-sensors';
import {map} from 'rxjs/operators';

const Magnetometer = () => {
  const [magnetometerData, setMagnetometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.magnetometer, 1000); // 1초 간격

    const subscription = magnetometer
      .pipe(map(({x, y, z}) => ({x, y, z})))
      .subscribe(
        data => setMagnetometerData(data),
        error => console.log('The sensor is not available', error),
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Magnetometer Data</Text>
      <Text style={styles.text}>X: {magnetometerData.x.toFixed(2)}</Text>
      <Text style={styles.text}>Y: {magnetometerData.y.toFixed(2)}</Text>
      <Text style={styles.text}>Z: {magnetometerData.z.toFixed(2)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});

export default Magnetometer;

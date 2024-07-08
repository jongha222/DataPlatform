import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  setUpdateIntervalForType,
  SensorTypes,
  gyroscope,
} from 'react-native-sensors';
import {map} from 'rxjs/operators';

const Gyroscope = () => {
  const [gyroscopeData, setGyroscopeData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });

  useEffect(() => {
    setUpdateIntervalForType(SensorTypes.gyroscope, 1000); // 1초 간격

    const subscription = gyroscope
      .pipe(map(({x, y, z}) => ({x, y, z})))
      .subscribe(
        data => setGyroscopeData(data),
        error => console.log('The sensor is not available', error),
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Gyroscope Data</Text>
      <Text style={styles.text}>X: {gyroscopeData.x.toFixed(2)}</Text>
      <Text style={styles.text}>Y: {gyroscopeData.y.toFixed(2)}</Text>
      <Text style={styles.text}>Z: {gyroscopeData.z.toFixed(2)}</Text>
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

export default Gyroscope;

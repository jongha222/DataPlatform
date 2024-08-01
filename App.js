import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  Switch,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import Geolocation from 'react-native-geolocation-service';
import {map} from 'rxjs/operators';

const sendSensorData = async (sensorType, data) => {
  try {
    const response = await fetch('http://192.168.123.102:8080/api/sensor/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({type: sensorType, data}),
    });

    if (response.ok) {
      return 'success';
    } else {
      return 'error';
    }
  } catch (error) {
    return `error: ${error.message}`;
  }
};

const DashboardScreen = () => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>대시보드</Text>
    <View style={styles.serviceDashboard}>
      <Text>서비스 1 대시보드</Text>
    </View>
    <View style={styles.serviceDashboard}>
      <Text>서비스 2 대시보드</Text>
    </View>
    <View style={styles.serviceDashboard}>
      <Text>서비스 3 대시보드</Text>
    </View>
  </SafeAreaView>
);

const ProfileScreen = ({navigation}) => (
  <SafeAreaView style={styles.container}>
    <Text style={styles.title}>프로필</Text>
    <View style={styles.profileContainer}>
      <View style={styles.profilePicture}>
        <Text style={styles.profileText}>프로필</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text>name</Text>
        <Text>nickname</Text>
        <Text>email</Text>
      </View>
    </View>
    <View style={styles.profileActions}>
      <TouchableOpacity style={styles.profileActionButton}>
        <Icon name="info-circle" size={30} color="#000" />
        <Text>내 정보</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.profileActionButton}
        onPress={() => navigation.navigate('SensorConsent')}>
        <Icon name="check-square" size={30} color="#000" />
        <Text>개인정보 동의</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const SensorConsentScreen = () => {
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
    const interval = setInterval(() => {
      Object.keys(isEnabled).forEach(key => {
        if (isEnabled[key] && sensorData[key].timestamp) {
          sendSensorData(key, sensorData[key]).then(result =>
            Alert.alert(
              result === 'success' ? 'Success' : 'Error',
              result === 'success'
                ? 'Data sent successfully'
                : `Error sending data: ${result}`,
            )
          );
        }
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      Object.values(subscriptions.current).forEach(subscription => {
        if (subscription) subscription.unsubscribe();
      });
    };
  }, [isEnabled, sensorData]);

  const formatSensorData = data => JSON.stringify(data, null, 2);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>개인정보 제공 동의</Text>

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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="Profile"
      component={ProfileScreen}
      options={{headerShown: false}}
    />
    <Stack.Screen
      name="SensorConsent"
      component={SensorConsentScreen}
      options={{title: '개인정보 제공 동의'}}
    />
  </Stack.Navigator>
);

const AppContainer = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          tabBarIcon: ({color, size}) => {
            let iconName;

            if (route.name === '서비스 이용') {
              iconName = 'list';
            } else if (route.name === '대시보드') {
              iconName = 'home';
            } else if (route.name === '프로필') {
              iconName = 'user';
            }

            return <Icon name={iconName} size={size} color={color} />;
          },
        })}
        tabBarOptions={{
          activeTintColor: 'tomato',
          inactiveTintColor: 'gray',
        }}>
        <Tab.Screen name="서비스 이용" component={() => <View />} />
        <Tab.Screen name="대시보드" component={DashboardScreen} />
        <Tab.Screen name="프로필" component={ProfileStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingTop: 50,
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  serviceDashboard: {
    width: '100%',
    height: 100,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileText: {
    color: 'red',
  },
  profileInfo: {
    flex: 1,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  profileActionButton: {
    alignItems: 'center',
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

export default AppContainer;

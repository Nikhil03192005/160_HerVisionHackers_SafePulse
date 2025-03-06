import React, { useState, useEffect } from 'react';
import { View, Text, Button, TouchableOpacity, Alert, TextInput, StyleSheet, ScrollView, Linking } from 'react-native';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

const POLICE_HELPLINE = '100';  // Police helpline number
const WOMEN_HELPLINE = '1091';  // Women helpline number

const App = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [addedContacts, setAddedContacts] = useState<{ name: string, number: string }[]>([]);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactNumber, setNewContactNumber] = useState<string>('');
  const [isHoldingSOS, setIsHoldingSOS] = useState(false);  // Track if SOS button is being held

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
    } else {
      setLocationPermission(true);
    }
  };

  const getLiveLocation = async () => {
    if (locationPermission) {
      try {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      } catch (error: unknown) {
        if (error instanceof Error) {
          Alert.alert('Error getting location:', error.message);
        } else {
          Alert.alert('An unknown error occurred');
        }
      }
    } else {
      Alert.alert('Location permission is required');
    }
  };

  const shareLocation = async () => {
    if (location) {
      const message = `My current location is: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;

      // Send location to added contacts (excluding helpline numbers)
      const contactsToSend = addedContacts.filter(
        (contact) => contact.number !== POLICE_HELPLINE && contact.number !== WOMEN_HELPLINE
      );

      contactsToSend.forEach((contact) => {
        SMS.sendSMSAsync(contact.number, message);
      });

      Alert.alert('Location shared successfully!');
    }
  };

  const makeEmergencyCall = () => {
    try {
      // Calling Police and Women helpline
      Linking.openURL(`tel:${POLICE_HELPLINE}`);
      Linking.openURL(`tel:${WOMEN_HELPLINE}`);

      // Calling added contacts (excluding helpline numbers)
      addedContacts.forEach((contact) => {
        if (contact.number !== POLICE_HELPLINE && contact.number !== WOMEN_HELPLINE) {
          Linking.openURL(`tel:${contact.number}`);
        }
      });
    } catch (error) {
      console.error('Error while calling', error);
    }
  };

  const startSOS = async () => {
    await makeEmergencyCall();  // Automatically call the helplines
  };

  const handleSOSPressIn = () => {
    setIsHoldingSOS(true);
    const startTime = Date.now();
    setTimer(setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 4000) {
        clearInterval(timer as NodeJS.Timeout);
        startSOS();  // Trigger SOS after 4 seconds
        setIsHoldingSOS(false);  // Reset the holding state
      }
    }, 100));
  };

  const handleSOSPressOut = () => {
    if (timer) {
      clearInterval(timer);  // Clear timer if button is released early
    }
    setIsHoldingSOS(false);  // Reset the holding state
  };

  const handleAddContact = () => {
    if (newContactName && newContactNumber) {
      setAddedContacts([...addedContacts, { name: newContactName, number: newContactNumber }]);
      setNewContactName('');
      setNewContactNumber('');
    } else {
      Alert.alert('Please provide both name and number');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safe Pulse</Text>

      {/* Location Display */}
      {location ? (
        <View style={styles.locationContainer}>
          <Text style={styles.locationText}>Latitude: {location.coords.latitude}</Text>
          <Text style={styles.locationText}>Longitude: {location.coords.longitude}</Text>
        </View>
      ) : (
        <Text style={styles.locationText}>Fetching location...</Text>
      )}

      {/* SOS Trigger Button */}
      <TouchableOpacity
        onPressIn={handleSOSPressIn}
        onPressOut={handleSOSPressOut}
        style={[styles.sosButton, isHoldingSOS && styles.sosButtonActive]}
      >
        <Text style={styles.buttonText}>Press and Hold for SOS</Text>
      </TouchableOpacity>

      {/* Get My Location Button */}
      <Button title="Get My Location" onPress={getLiveLocation} color="#990000" />

      {/* Space between buttons */}
      <View style={styles.spacing}></View>

      {/* Share Location Button */}
      <Button title="Share My Location" onPress={shareLocation} color="#990000" />

      {/* Add Emergency Contact */}
      <View style={styles.addContactContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter Name"
          value={newContactName}
          onChangeText={setNewContactName}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Phone Number"
          value={newContactNumber}
          onChangeText={setNewContactNumber}
          keyboardType="phone-pad"
        />
        <TouchableOpacity onPress={handleAddContact} style={styles.addContactButton}>
          <Text style={styles.addContactButtonText}>Add Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Emergency Contact List */}
      <Text style={styles.contactTitle}>Emergency Contacts:</Text>
      {addedContacts.map((contact, index) => (
        <View key={index} style={styles.contactItem}>
          <Text style={styles.contactText}>{contact.name}: {contact.number}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f7f7f7',
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#990000',  // Updated to #990000
    textAlign: 'center',
  },
  locationContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#00796b',
  },
  locationText: {
    fontSize: 16,
    color: '#00796b',
  },
  sosButton: {
    padding: 20,
    backgroundColor: '#990000',
    borderRadius: 50,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  sosButtonActive: {
    backgroundColor: '#C0392B',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addContactContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#009688',
    borderRadius: 5,
    padding: 10,
    width: '80%',
    marginBottom: 15,
    fontSize: 16,
    color: '#00796b',
  },
  addContactButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  addContactButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#00796b',
  },
  contactItem: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    borderWidth: 1,
    borderColor: '#009688',
  },
  contactText: {
    fontSize: 16,
    color: '#00796b',
  },
  spacing: {
    marginBottom: 15,  // Adds space between the buttons
  },
});

export default App;

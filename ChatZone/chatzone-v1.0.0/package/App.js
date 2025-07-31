import * as React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, LogBox, TouchableOpacity, Image, TextInput, ScrollView, Alert, FlatList } from 'react-native';
import firebase from 'firebase/compat/app';
import { getDatabase, ref, onValue, set, orderByKey, child, update, remove, push, off } from 'firebase/database';
import { getAuth, deleteUser, updateEmail, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
import { Provider as PaperProvider, Card, List, Button, Avatar } from 'react-native-paper';
import LoginScreen from './screen/Login';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import SendMessageInput from './SendMessageInput';
import { createStackNavigator } from '@react-navigation/stack';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const firebaseConfig = {
  apiKey: "AIzaSyAWO15eZvc0YqFwz2NveXxwkS6Dzx-9waE",
  authDomain: "chatzone-66bca.firebaseapp.com",
  databaseURL: "https://chatzone-66bca-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "chatzone-66bca",
  storageBucket: "chatzone-66bca.appspot.com",
  messagingSenderId: "152431931828",
  appId: "1:152431931828:web:1d749904e08efb7a5482e1",
  measurementId: "G-QESTTRBWQM"
};

LogBox.ignoreAllLogs(true);

try {
  firebase.initializeApp(firebaseConfig);
} catch (err) { }

function ChatScreen() {
  const [messages, setMessages] = React.useState(null);
  const currentUser = getAuth().currentUser;

  React.useEffect(() => {
    const chatRef = ref(getDatabase(), `messages/${currentUser.uid}`);
    onValue(chatRef, (snapshot) => {
      setMessages(snapshot.val());
    });

    return () => {
      off(chatRef);
    };
  }, [currentUser.uid]);

  if (!messages) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  } else {
    return (
      <View style={styles.container}>
        <FlatList
          data={Object.keys(messages)}
          renderItem={({ item }) => {
            const { message, senderId } = messages[item];
            const isCurrentUser = senderId === currentUser.uid;

            return (
              <View style={[styles.messageContainer, isCurrentUser && styles.currentUserMessageContainer]}>
                <Text style={[styles.messageText, isCurrentUser && styles.currentUserMessageText]}>{message}</Text>
              </View>
            );
          }}
          keyExtractor={(_, index) => index.toString()}
          inverted
        />
      </View>
    );
  }
}

function ChatRoom({ route }) {
  const [messages, setMessages] = React.useState([]);
  const { friendId, friendImage, friendUsername } = route.params;
  const currentUser = getAuth().currentUser;
  const flatListRef = React.useRef(null);

  const handleSendMessage = (message) => {
    const chatRef = ref(getDatabase(), `messages/${currentUser.uid}/${friendId}`);
    push(chatRef, { message, senderId: currentUser.uid });
    onSendMessage(message, friendId);
    flatListRef.current.scrollToEnd({ animated: false });
  }

  const onSendMessage = (message, friendId) => {
  }

  React.useEffect(() => {
    const chatRef = ref(getDatabase(), `messages/${currentUser.uid}/${friendId}`);
    onValue(chatRef, (snapshot) => {
      const messagesObject = snapshot.val();
      if (messagesObject) {
        const messagesArray = Object.keys(messagesObject).map((key) => {
          return { ...messagesObject[key], key };
        }).filter((message) => message.senderId === friendId || message.senderId === currentUser.uid);
        setMessages(messagesArray);
        flatListRef.current.scrollToEnd({ animated: false });
      }
    });

    return () => {
      off(chatRef);
    };
  }, [currentUser.uid, friendId]);


  const renderMessage = ({ item }) => {
    const isCurrentUser = item.senderId === currentUser.uid;
    const messageContainerStyle = isCurrentUser ? styles4.currentUserMessageContainer : styles4.friendMessageContainer;
    const messageTextStyle = isCurrentUser ? styles4.currentUserMessageText : styles4.friendMessageText;

    console.log(item)
    return (
      <View key={item.key} style={[styles4.messageContainer, messageContainerStyle]}>
        <Text style={[styles4.messageText, messageTextStyle]}>{item.message}</Text>
      </View>
    );
  };


  const keyExtractor = (item) => item.key;

  return (
    <View style={styles4.container}>
      <View style={styles4.header}>
        <Avatar.Image size={40} source={{ uri: friendImage }} />
        <Text style={styles4.friendName}>{friendUsername}</Text>
      </View>
      <FlatList
        key={messages.length}
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
      />
      <SendMessageInput onSendMessage={handleSendMessage} friendId={friendId} />
    </View>
  );
}

function PeopleScreen() {
  const [userList, setUserList] = React.useState(null);
  const currentUser = getAuth().currentUser;
  const navigation = useNavigation();

  React.useEffect(() => {
    const tb = ref(getDatabase(), "users/");
    onValue(tb, (snapshot) => {
      setUserList(snapshot.val());
    });
  }, []);

  if (!userList) {
    return (
      <ScrollView style={styles2.container} contentContainerStyle={{ padding: 20 }}>
        <Text>Loading...</Text>
      </ScrollView>
    );
  } else if (Object.keys(userList).length === 0) {
    return (
      <ScrollView style={styles2.container} contentContainerStyle={{ padding: 20 }}>
        <Text>No Users</Text>
      </ScrollView>
    );
  } else {
    return (
      <ScrollView style={styles2.container} contentContainerStyle={{ padding: 20 }}>
        {Object.keys(userList).map((userId) => {
          if (userId !== currentUser.uid) {
            const { image, username } = userList[userId];
            return (
              <TouchableOpacity
                key={userId}
                style={styles2.friendItem}
                onPress={() =>
                  navigation.navigate('ChatRoom', {
                    friendId: userId,
                    friendImage: userList[userId].image,
                    friendUsername: userList[userId].username,
                  })
                }
              >
                <Avatar.Image size={60} source={{ uri: image }} />
                <Text style={styles2.friendName}>{username}</Text>
              </TouchableOpacity>

            );
          } else {
            return null;
          }
        })}
      </ScrollView>
    );
  }
}

function SettingsScreen() {
  const user = getAuth().currentUser;
  const [userData, setUserData] = React.useState(null);
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState('');
  const [newPhone, setNewPhone] = React.useState('');
  const [newImage, setNewImage] = React.useState('');
  const db = getDatabase();
  const usersRef = ref(db, 'users/' + user.uid);
  const navigation = useNavigation();

  React.useEffect(() => {
    onValue(usersRef, (snapshot) => {
      // Get the data from the snapshot
      const data = snapshot.val();
      // Do something with the data
      setUserData(data);
    });
  }, [user.uid]);

  const handleEdit = () => {
    setIsEditMode(true);
    setNewUsername(userData.username);
    setNewPhone(userData.phoneNumber);
    setNewImage(userData.image);
  };

  const resetPassword = () => {
    sendPasswordResetEmail(getAuth(), userData.email)
      .then(() => {
        Alert.alert("Reset password", "Password reset email sent successfully")
      })
      .catch((error) => {
        Alert.alert("Reset password", error.code)
      });
  };

  const handleSave = () => {
    // update the user data with the new username
    update(usersRef, { username: newUsername, phoneNumber: newPhone, image: newImage }).then(() => {
      // turn off edit mode and update the user data
      setIsEditMode(false);
      setUserData((prevUserData) => ({
        ...prevUserData,
        username: newUsername,
        phoneNumber: newPhone,
        image: newImage,
      }));
    });
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setNewUsername(userData.username);
    setNewPhone(userData.phoneNumber);
    setNewImage(userData.image);
  };

  return (
    <ScrollView style={styles3.settingContainer}>
      <Text style={styles3.textMenu}>User Settings</Text>
      {userData && (
        <View style={styles3.profileContainer}>
          <Image source={{ uri: userData.image }} style={styles3.avatarImage} />
          {isEditMode ? (
            <View style={styles3.editContainer}>
              <Text style={styles3.editLabel}>Name</Text>
              <TextInput
                style={styles3.editInput}
                value={newUsername}
                onChangeText={setNewUsername}
              />
              <Text style={styles3.editLabel}>Email</Text>
              <TextInput
                style={styles3.editInput}
                value={userData.email}
                onChangeText={userData.email}
                editable={false}
                keyboardType='email-address' />
              <TouchableOpacity style={styles3.editButton} onPress={resetPassword}>
                <Text style={styles3.editButtonText}>Reset Password</Text>
              </TouchableOpacity>
              <Text style={styles3.editLabel}>Phone Number</Text>
              <TextInput
                style={styles3.editInput}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType='phone-pad' />
              <Text style={styles3.editLabel}>Image URL</Text>
              <TextInput
                style={styles3.editInput}
                value={newImage}
                onChangeText={setNewImage}
                keyboardType='url' />
              <View style={styles3.editButtonGroup}>
                <TouchableOpacity onPress={handleSave} style={styles3.saveButton}>
                  <Text style={styles3.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} style={styles3.cancelButton}>
                  <Text style={styles3.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles3.userInfoContainer}>
              <Text style={styles3.userInfoText}>{userData.username}</Text>
              <TouchableOpacity onPress={handleEdit} style={styles3.editButton}>
                <Text style={styles3.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
      <Text style={styles3.textMenu}>Account Management</Text>
      <TouchableOpacity style={styles3.dangerContainer} onPress={deleteAccount}>
        <Text style={styles3.dangerText}>Delete Account</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles3.dangerContainer} onPress={() => getAuth().signOut()}>
        <Text style={styles3.dangerText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function deleteAccount() {
  Alert.alert(
    'Delete account?',
    'Are you sure you want to delete your account?',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            // Delete user account from Firebase Authentication
            const user = getAuth().currentUser;
            await user.delete();

            // Delete user data from Firebase Realtime Database
            const db = getDatabase();
            const userId = user.uid;
            await remove(ref(db, `users/${userId}`));

            // Log out the user
            await auth.signOut();
          } catch (error) {
            console.error('Error deleting account:', error);
          }
        },
      },
    ],
    { cancelable: false }
  );
}

function ChatStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name='Chat' component={ChatScreen} />
      <Stack.Screen name='ChatRoom' component={ChatRoom} />
    </Stack.Navigator>
  );
}


export default function App() {
  const [user, setUser] = React.useState(null);
  const [isChatRoomVisible, setIsChatRoomVisible] = React.useState(false);

  React.useEffect(() => {
    var auth = getAuth();
    auth.onAuthStateChanged(function (us) {
      setUser(us);
    });
  }, []);

  if (user == null) {
    return (
      <NavigationContainer>
        <LoginScreen />
      </NavigationContainer>
    );
  }
  return (
    <PaperProvider>
      <NavigationContainer>
        <Tab.Navigator>
          <Tab.Screen
            name="Chats"
            component={ChatStack}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="chatbubbles-outline" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="People"
            component={PeopleScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="people-outline" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color, size }) => (
                <Ionicons name="settings-outline" color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
        <StatusBar backgroundColor="skyblue" />
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F6F7F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  text: {
    fontSize: 20,
  },
  profileContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginBottom: 20,
  }, userInfoText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  textMenu: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  dangerContainer: {
    backgroundColor: '#F9D0C4',
    borderRadius: 5,
    padding: 8,
    marginTop: 8,
  },
  dangerText: {
    color: '#E74C3C',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const styles2 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: 'skyblue',
    borderRadius: 10,
    overflow: 'hidden',
  },
  friendImage: {
    width: 80,
    height: 80,
  },
  friendImageBackground: {
    borderRadius: 10,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginStart: 20,
  },
});

const styles3 = StyleSheet.create({
  settingContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginVertical: 30,
  },
  textMenu: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  userInfoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333',
    textAlign: 'center',
  },
  dangerContainer: {
    backgroundColor: '#f00',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  dangerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  editLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  editInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  editButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  editButton: {
    backgroundColor: '#2196F3',
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    borderRadius: 5,
    padding: 10,
    marginLeft: 10,
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

const styles4 = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2e3e4e',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  backButton: {
    marginRight: 10,
  },
  friendName: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  messageContainer: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    maxWidth: '80%',
    padding: 10,
    marginVertical: 5,
    alignSelf: 'flex-start',
  },
  currentUserMessageContainer: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 16,
    color: '#000',
  },
  currentUserMessageText: {
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 5,
    margin: 10,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 18,
  },
  sendButton: {
    backgroundColor: '#1c5f97',
    borderRadius: 20,
    padding: 10,
    marginLeft: 5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendMessageContainer: {
    backgroundColor: "gray",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    color: "#000",
  },
  currentUserMessageText: {
    textAlign: "right",
  },
  friendMessageText: {
    textAlign: "left",
  },
});
